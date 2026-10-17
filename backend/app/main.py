import asyncio
import io
import json
import os
import sqlite3
import warnings
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from . import vision

load_dotenv()
DB_PATH = Path(os.getenv('AWAMON_DB', 'data/awamon.sqlite3'))
JST = ZoneInfo('Asia/Tokyo')
LEVELS = [0, 30, 80, 150, 250]
MAX_BYTES = 8 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 24_000_000

def now():
    return datetime.now(timezone.utc).isoformat()

@contextmanager
def database():
    connection = sqlite3.connect(DB_PATH, timeout=15)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA secure_delete=ON")
    try:
        with connection:
            yield connection
    finally:
        connection.close()

def initialize():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with database() as db:
        db.execute('PRAGMA secure_delete=ON')
        db.executescript('''
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY, started_at TEXT NOT NULL, completed_at TEXT,
          status TEXT NOT NULL DEFAULT 'washing', completion_method TEXT,
          analysis TEXT, before_image BLOB, reward_amount INTEGER NOT NULL DEFAULT 0,
          reward_day TEXT, consent INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS one_active ON sessions((1)) WHERE completed_at IS NULL AND status != 'cancelled';
        ''')
    cleanup()

def cleanup():
    with database() as db:
        db.execute('PRAGMA secure_delete=ON')
        db.execute("UPDATE sessions SET before_image=NULL WHERE started_at < ?", ((datetime.now(timezone.utc)-timedelta(hours=24)).isoformat(),))

async def housekeeping():
    while True:
        await asyncio.sleep(60)
        cleanup()

@asynccontextmanager
async def lifespan(app):
    initialize()
    task = asyncio.create_task(housekeeping())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(title='あわもん', lifespan=lifespan)

@app.middleware('http')
async def private_responses(request, call_next):
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    return response

def get_session(db, session_id):
    row = db.execute('SELECT * FROM sessions WHERE id=?', (session_id,)).fetchone()
    if not row:
        raise HTTPException(404, '記録が見つかりません。')
    return row

def public(row):
    value = {k: row[k] for k in ['id', 'started_at', 'completed_at', 'status', 'completion_method', 'reward_amount']}
    value['analysis'] = json.loads(row['analysis']) if row['analysis'] else None
    return value

async def photo(file: UploadFile):
    raw = await file.read(MAX_BYTES + 1)
    await file.close()
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, '写真は8MB以下にしてください。')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(raw)) as original:
                if original.format not in ('JPEG', 'PNG', 'WEBP'):
                    raise ValueError('format')
                img = ImageOps.exif_transpose(original).convert('RGB')
                img.thumbnail((1280, 1280))
                output = io.BytesIO()
                img.save(output, format='JPEG', quality=85)
                return output.getvalue()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(422, 'JPEG・PNG・WebPの写真を選んでください。')

def grant(db, session_id, method):
    row = get_session(db, session_id)
    if row['completed_at']:
        return public(row)
    day = datetime.now(JST).date().isoformat()
    count = db.execute('SELECT COUNT(*) FROM sessions WHERE reward_day=? AND reward_amount>0', (day,)).fetchone()[0]
    reward = 10 if count < 3 else 0
    db.execute("UPDATE sessions SET status='completed',completed_at=?,completion_method=?,reward_amount=?,reward_day=?,before_image=NULL WHERE id=?", (now(), method, reward, day, session_id))
    return public(get_session(db, session_id))

@app.get('/api/game-state')
def state():
    cleanup()
    with database() as db:
        total = db.execute('SELECT COALESCE(SUM(reward_amount),0) FROM sessions').fetchone()[0]
        count = db.execute('SELECT COUNT(*) FROM sessions WHERE completed_at IS NOT NULL').fetchone()[0]
        active = db.execute("SELECT * FROM sessions WHERE completed_at IS NULL AND status!='cancelled' LIMIT 1").fetchone()
        today = db.execute('SELECT COUNT(*) FROM sessions WHERE reward_day=? AND reward_amount>0', (datetime.now(JST).date().isoformat(),)).fetchone()[0]
    level = sum(total >= threshold for threshold in LEVELS)
    return {'total_drops': total, 'pond_level': level, 'next_level_at': LEVELS[level] if level < 5 else None, 'completed_count': count, 'today_rewards': today, 'active_session': public(active) if active else None, 'ai_enabled': vision.enabled()}

@app.get('/api/sessions')
def history():
    with database() as db:
        return [public(row) for row in db.execute('SELECT * FROM sessions WHERE completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 50')]

@app.post('/api/sessions')
async def start(image: UploadFile = File(...), consent: bool = Form(False)):
    data = await photo(image)
    with database() as db:
        db.execute('BEGIN IMMEDIATE')
        active = db.execute("SELECT * FROM sessions WHERE completed_at IS NULL AND status!='cancelled' LIMIT 1").fetchone()
        if active:
            return public(active)
        session_id = str(uuid4())
        db.execute('INSERT INTO sessions(id,started_at,before_image,consent) VALUES(?,?,?,?)', (session_id, now(), data, int(consent)))
        return public(get_session(db, session_id))

@app.post('/api/sessions/{session_id}/complete')
async def complete(session_id: str, image: UploadFile = File(...)):
    data = await photo(image)
    cleanup()
    with database() as db:
        db.execute('BEGIN IMMEDIATE')
        row = get_session(db, session_id)
        if row['completed_at']:
            return public(row)
        if row['status'] == 'cancelled':
            raise HTTPException(409, 'この記録は取り消されています。')
        if row['attempts'] >= 5:
            raise HTTPException(429, '写真の確認は5回までです。自分で完了を記録できます。')
        db.execute('UPDATE sessions SET attempts=attempts+1 WHERE id=?', (session_id,))
        before, consent = row['before_image'], row['consent']
    if not before:
        analysis = vision.fallback('保存期限を過ぎたため写真を削除しました。自分で完了を記録できます。')
    elif not consent:
        analysis = vision.fallback('写真をAIへ送信せず、自分で完了を記録できます。')
    else:
        analysis = await vision.analyze(before, data)
    with database() as db:
        db.execute('BEGIN IMMEDIATE')
        row = get_session(db, session_id)
        if row['completed_at'] or row['status'] == 'cancelled':
            return public(row)
        db.execute('UPDATE sessions SET status=?,analysis=? WHERE id=?', (analysis.status, analysis.model_dump_json(), session_id))
        if analysis.status == 'likely_done':
            return grant(db, session_id, 'ai')
        return public(get_session(db, session_id))

@app.post('/api/sessions/{session_id}/confirm')
def confirm(session_id: str):
    with database() as db:
        db.execute('PRAGMA secure_delete=ON')
        db.execute('BEGIN IMMEDIATE')
        row = get_session(db, session_id)
        if row['status'] == 'cancelled':
            raise HTTPException(409, 'この記録は取り消されています。')
        return grant(db, session_id, 'self_report')

@app.delete('/api/sessions/{session_id}')
def cancel(session_id: str):
    with database() as db:
        db.execute('PRAGMA secure_delete=ON')
        db.execute('BEGIN IMMEDIATE')
        row = get_session(db, session_id)
        if row['completed_at']:
            raise HTTPException(409, '完了済みの記録です。')
        db.execute("UPDATE sessions SET status='cancelled',before_image=NULL WHERE id=?", (session_id,))
    return {'ok': True}
