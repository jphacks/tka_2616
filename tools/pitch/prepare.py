from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[2]
out = Path('/tmp/yuruchara-pitch')
out.mkdir(parents=True, exist_ok=True)
for character in ['awamon', 'ingredients', 'cooking', 'laundry']:
    for level in [1, 2, 5]:
        image = Image.open(root / f'frontend/public/assets/{character}/pixel/form-{level}.png').convert('RGBA')
        image = image.crop(image.getbbox())
        image.resize((image.width * 16, image.height * 16), Image.Resampling.NEAREST).save(out / f'{character}-{level}.png')
image = Image.open(root / 'art/qa/evolution/dishes/snap-126.png')
image.resize((1920, 1152), Image.Resampling.NEAREST).save(out / 'pond.png')

# Reuse the app's 20-frame / 200ms sprite strips; never invent motion frames.
import json

def animation(character, level, motions, name, scale):
    folder = root / f'frontend/public/assets/{character}/pixel'
    meta = json.loads((folder / 'metadata.json').read_text())
    width, height = meta['size']
    frames = []
    bounds = None
    for motion in motions:
        strip = Image.open(folder / f'{motion}-{level}.png').convert('RGBA')
        assert strip.size == (width * meta['frames'], height)
        for index in range(meta['frames']):
            frame = strip.crop((index * width, 0, (index + 1) * width, height))
            box = frame.getbbox()
            if box:
                bounds = box if bounds is None else (min(bounds[0], box[0]), min(bounds[1], box[1]), max(bounds[2], box[2]), max(bounds[3], box[3]))
            frames.append(frame)
    # A shared crop keeps the original frame-to-frame anchor and visible particles.
    rendered = []
    for frame in frames:
        canvas = Image.new('RGBA', (width, height), '#e0edf1')
        canvas.alpha_composite(frame)
        rendered.append(canvas.crop(bounds).convert('RGB').resize(((bounds[2]-bounds[0])*scale, (bounds[3]-bounds[1])*scale), Image.Resampling.NEAREST))
    rendered[0].save(out / name, save_all=True, append_images=rendered[1:], duration=meta['frame_ms'], loop=0, disposal=2, optimize=False)
    with Image.open(out / name) as gif:
        total = 0
        unique = set()
        for index in range(gif.n_frames):
            gif.seek(index)
            total += gif.info['duration']
            unique.add(gif.convert('RGB').tobytes())
        assert total == len(frames) * meta['frame_ms'] and len(unique) > 1
        print(name, gif.size, gif.n_frames, 'frames', total, 'ms')

animation('awamon', 2, ['wave', 'idle', 'happy', 'idle'], 'awamon-hero.gif', 12)
for character, motion in [('awamon','bubble'), ('ingredients','wave'), ('cooking','dance'), ('laundry','happy')]:
    animation(character, 1, ['idle', motion, 'idle'], f'{character}-small.gif', 6)
