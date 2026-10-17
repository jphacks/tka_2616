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
    async def analyze(before, after):
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
