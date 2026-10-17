import io
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from app import main, vision

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, 'DB_PATH', tmp_path / 'test.sqlite3')
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    with TestClient(main.app) as client:
        yield client

def image(color='red'):
    output = io.BytesIO()
    Image.new('RGB', (32, 32), color).save(output, 'PNG')
    return ('dish.png', output.getvalue(), 'image/png')

def start(client, consent=False):
    response = client.post('/api/sessions', files={'image': image()}, data={'consent': str(consent).lower()})
    assert response.status_code == 200
    return response.json()['id']

def test_self_report_restart_and_atomic_reward(client):
    sid = start(client)
    assert client.get('/api/game-state').json()['active_session']['id'] == sid
    result = client.post(f'/api/sessions/{sid}/complete', files={'image': image('blue')}).json()
    assert result['status'] == 'uncertain'
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(lambda _: client.post(f'/api/sessions/{sid}/confirm').json(), range(12)))
    assert all(r['reward_amount'] == 10 for r in results)
    main.initialize()
    state = client.get('/api/game-state').json()
    assert state['total_drops'] == 10
    assert state['active_session'] is None
    assert len(client.get('/api/sessions').json()) == 1
    with main.database() as db:
        assert main.get_session(db, sid)['before_image'] is None

def test_daily_limit_and_growth(client):
    for _ in range(4):
        sid = start(client)
        assert client.post(f'/api/sessions/{sid}/confirm').status_code == 200
    state = client.get('/api/game-state').json()
    assert state['total_drops'] == 30
    assert state['pond_level'] == 2
    assert state['today_rewards'] == 3
    assert state['completed_count'] == 4

def test_single_active_and_cancellation(client):
    sid = start(client)
    assert start(client) == sid
    assert client.delete(f'/api/sessions/{sid}').status_code == 200
    assert client.post(f'/api/sessions/{sid}/confirm').status_code == 409
    assert client.post(f'/api/sessions/{sid}/complete', files={'image': image()}).status_code == 409
    assert start(client) != sid

def test_validation_and_missing(client):
    assert client.post('/api/sessions', files={'image': ('x.jpg', b'not an image', 'image/jpeg')}).status_code == 422
    assert client.post('/api/sessions', files={'image': ('x.jpg', b'x' * (main.MAX_BYTES + 1), 'image/jpeg')}).status_code == 413
    assert client.post('/api/sessions/missing/confirm').status_code == 404

def test_expired_photo_can_still_finish(client):
    sid = start(client, True)
    with main.database() as db:
        db.execute('UPDATE sessions SET started_at=? WHERE id=?', ((datetime.now(timezone.utc)-timedelta(days=2)).isoformat(), sid))
    client.get('/api/game-state')
    with main.database() as db:
        assert main.get_session(db, sid)['before_image'] is None
    assert client.post(f'/api/sessions/{sid}/confirm').json()['reward_amount'] == 10

def test_ai_completion_idempotent(client, monkeypatch):
    async def analyze(before, after, task='dishes'):
        return vision.Analysis(status='likely_done', reason='汚れが減りました。', observed_changes=['汚れが減少'], washing_evidence=['皿の汚れが消えた'], alternative_explanations=[], uncertainties=[])
    monkeypatch.setattr(vision, 'analyze', analyze)
    sid = start(client, True)
    response = client.post(f'/api/sessions/{sid}/complete', files={'image': image('blue')}).json()
    assert response['completion_method'] == 'ai'
    assert response['reward_amount'] == 10
    client.post(f'/api/sessions/{sid}/complete', files={'image': image('blue')})
    client.post(f'/api/sessions/{sid}/confirm')
    assert client.get('/api/game-state').json()['total_drops'] == 10

def test_ai_consent_and_attempt_limit(client, monkeypatch):
    async def forbidden(*args):
        raise AssertionError('no consent: must not call provider')
    monkeypatch.setattr(vision, 'analyze', forbidden)
    sid = start(client)
    for _ in range(5):
        assert client.post(f'/api/sessions/{sid}/complete', files={'image': image('blue')}).status_code == 200
    assert client.post(f'/api/sessions/{sid}/complete', files={'image': image()}).status_code == 429
    assert client.post(f'/api/sessions/{sid}/confirm').status_code == 200

def test_duplicate_photos_and_missing_ai():
    import asyncio
    assert asyncio.run(vision.analyze(b'same', b'same')).status == 'uncertain'


def test_task_progress_active_sessions_and_daily_limits_are_separate(client):
    tasks = ['dishes', 'ingredients', 'cooking', 'laundry']
    active = {}
    for task in tasks:
        result = client.post('/api/sessions', files={'image': image()}, data={'task': task}).json()
        assert result['task'] == task
        active[task] = result['id']
    assert len(set(active.values())) == 4
    for task in tasks:
        state = client.get('/api/game-state', params={'task': task}).json()
        assert state['active_session']['id'] == active[task]
        for i in range(4):
            sid = active[task] if i == 0 else client.post('/api/sessions', files={'image': image()}, data={'task': task}).json()['id']
            result = client.post(f'/api/sessions/{sid}/confirm').json()
            assert result['reward_amount'] == (10 if i < 3 else 0)
        state = client.get('/api/game-state', params={'task': task}).json()
        assert state['total_drops'] == 30 and state['pond_level'] == 2
        history = client.get('/api/sessions', params={'task': task}).json()
        assert len(history) == 4 and all(row['task'] == task for row in history)


def test_cancel_one_character_preserves_others(client):
    sessions = {}
    for task in ['dishes', 'ingredients']:
        sessions[task] = client.post('/api/sessions', files={'image': image()}, data={'task': task}).json()['id']
    client.delete('/api/sessions/' + sessions['ingredients'])
    assert client.get('/api/game-state').json()['active_session']['id'] == sessions['dishes']
    assert client.get('/api/game-state?task=ingredients').json()['active_session'] is None


def test_invalid_task_rejected(client):
    assert client.get('/api/game-state?task=unknown').status_code == 422
    assert client.get('/api/sessions?task=unknown').status_code == 422
    assert client.post('/api/sessions', files={'image': image()}, data={'task': 'unknown'}).status_code == 422


def test_legacy_database_migration_preserves_awamon(tmp_path, monkeypatch):
    import sqlite3
    from fastapi.testclient import TestClient
    path = tmp_path / 'legacy.sqlite3'
    with sqlite3.connect(path) as db:
        db.executescript('''CREATE TABLE sessions (
          id TEXT PRIMARY KEY, started_at TEXT NOT NULL, completed_at TEXT,
          status TEXT NOT NULL DEFAULT 'washing', completion_method TEXT,
          analysis TEXT, before_image BLOB, reward_amount INTEGER NOT NULL DEFAULT 0,
          reward_day TEXT, consent INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX one_active ON sessions((1)) WHERE completed_at IS NULL AND status != 'cancelled';
        INSERT INTO sessions(id,started_at,completed_at,status,reward_amount) VALUES('old-done','2026-10-17','2026-10-17','completed',80);
        INSERT INTO sessions(id,started_at,status) VALUES('old-active','2026-10-17','washing');''')
    monkeypatch.setattr(main, 'DB_PATH', path)
    with TestClient(main.app) as migrated:
        state = migrated.get('/api/game-state').json()
        assert state['total_drops'] == 80 and state['pond_level'] == 3
        assert state['active_session']['id'] == 'old-active'
        assert migrated.get('/api/game-state?task=cooking').json()['total_drops'] == 0
        assert migrated.post('/api/sessions', files={'image': image()}, data={'task': 'cooking'}).status_code == 200
        main.initialize()  # migration is repeatable with multiple active characters
        assert migrated.get('/api/game-state').json()['total_drops'] == 80
