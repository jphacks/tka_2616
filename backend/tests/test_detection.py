import io
from fastapi.testclient import TestClient
from PIL import Image
from app import detection, main


def test_detection_endpoint_sanitizes_photo_and_does_not_record(tmp_path, monkeypatch):
    monkeypatch.setattr(main, 'DB_PATH', tmp_path / 'test.sqlite3')
    def predict(data):
        image = Image.open(io.BytesIO(data))
        assert image.format == 'JPEG'
        assert max(image.size) <= 1280
        return {'status': 'ready', 'objects': [{'label': 'お皿', 'box': [.1, .2, .5, .6], 'confidence': .9}]}
    monkeypatch.setattr(detection, 'predict', predict)
    image = io.BytesIO()
    Image.new('RGB', (1600, 800)).save(image, 'PNG')
    with TestClient(main.app) as client:
        before = client.get('/api/game-state').json()
        response = client.post('/api/detections', files={'image': ('x.png', image.getvalue(), 'image/png')})
        assert response.status_code == 200
        assert response.json()['objects'][0]['label'] == 'お皿'
        assert client.get('/api/game-state').json() == before
        assert client.post('/api/detections', files={'image': ('x.jpg', b'invalid', 'image/jpeg')}).status_code == 422
        assert client.post('/api/detections').status_code == 422


def test_detection_disabled_busy_and_failure_release_lock(monkeypatch):
    monkeypatch.setenv('YOLOE_ENABLED', '0')
    assert detection.predict(b'')['status'] == 'unavailable'
    monkeypatch.setattr(detection, 'available', lambda: True)
    with detection._lock:
        assert detection.predict(b'')['status'] == 'busy'
    monkeypatch.setattr(detection, '_model', object())
    assert detection.predict(b'invalid')['status'] == 'unavailable'
    assert not detection._lock.locked()
