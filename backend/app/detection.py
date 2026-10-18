"""Local YOLOE preview only. Never decides completion or saves uploaded photos."""
import io
import logging
import os
import threading
import time
from pathlib import Path
from PIL import Image

MODEL_PATH = Path(__file__).resolve().parents[1] / 'models/yoloe-11s-seg-pf.pt'
_model = None
_lock = threading.Lock()
LABELS = {'plate': 'お皿', 'plate (dish)': 'お皿', 'dish': '食器', 'bowl': 'ボウル', 'cup': 'カップ', 'mug': 'マグカップ', 'glass': 'グラス', 'wine glass': 'グラス', 'wineglass': 'グラス', 'fork': 'フォーク', 'spoon': 'スプーン', 'knife': 'ナイフ', 'chopstick': 'お箸', 'chopsticks': 'お箸', 'saucer': '小皿', 'teacup': 'カップ', 'drinking glass': 'グラス'}
LABELS.update({'coffee cup': 'カップ', 'beer glass': 'グラス', 'martini glass': 'グラス', 'shot glass': 'グラス', 'glass bowl': 'ボウル', 'glass plate': 'お皿', 'measuring cup': '計量カップ', 'mixing bowl': 'ボウル', 'salad bowl': 'ボウル', 'soup bowl': 'ボウル', 'sugar bowl': 'ボウル', 'soupspoon': 'スプーン', 'wooden spoon': 'スプーン', 'kitchen knife': '包丁', 'steak knife': 'ナイフ'})

def available():
    return MODEL_PATH.is_file() and os.getenv('YOLOE_ENABLED', '1') != '0'

def predict(data: bytes):
    if not available():
        return {'status': 'unavailable', 'objects': []}
    if not _lock.acquire(blocking=False):
        return {'status': 'busy', 'objects': []}
    try:
        global _model
        started = time.monotonic()
        if _model is None:
            os.environ.setdefault('YOLO_CONFIG_DIR', str(MODEL_PATH.parent / 'config'))
            os.environ.setdefault('MPLCONFIGDIR', str(MODEL_PATH.parent / 'matplotlib'))
            import torch
            from ultralytics import YOLOE
            torch.set_num_threads(4)
            _model = YOLOE(str(MODEL_PATH))
        image = Image.open(io.BytesIO(data)).convert('RGB')
        result = _model.predict(image, device='cpu', imgsz=640, conf=.2, max_det=50, verbose=False, save=False)[0]
        objects = []
        for box in result.boxes:
            name = result.names[int(box.cls.item())].lower()
            label = LABELS.get(name)
            if not label:
                continue
            coords = [max(0., min(1., float(v))) for v in box.xyxyn[0].tolist()]
            x1, y1, x2, y2 = coords
            if x2 <= x1 or y2 <= y1:
                continue
            objects.append({'label': label, 'confidence': round(float(box.conf.item()), 3), 'box': coords})
        return {'status': 'ready', 'objects': objects[:20], 'elapsed_ms': round((time.monotonic()-started)*1000)}
    except Exception as error:
        # Detection must not block the original capture / GPT / self-report flow.
        logging.getLogger(__name__).warning('YOLOE unavailable: %s', type(error).__name__)
        return {'status': 'unavailable', 'objects': []}
    finally:
        _lock.release()
