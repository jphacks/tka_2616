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
