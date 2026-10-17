"""Encode the scene's original indexed actor buffers as transparent PNG sheets."""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
data=json.loads((ROOT/'art/exports/frames.json').read_text())
palette=[tuple(bytes.fromhex(c[1:]))+(255,) for c in data['palette']]
out=ROOT/'frontend/public/assets/awamon/pixel';out.mkdir(parents=True,exist_ok=True)
preview=Image.new('RGB',(5*128,5*144),'#f5efdf')
for row,(mode,levels) in enumerate(data['states'].items()):
    for level,frames in enumerate(levels,1):
        sheet=Image.new('RGBA',(64*len(frames),64))
        for index,buf in enumerate(frames):
            frame=Image.new('RGBA',(64,64))
            for y in range(64):
                for x in range(64):
                    source=(y+16)*160+x+48;c=buf[source]
                    if c!=255:frame.putpixel((x,y),palette[c])
                    elif any(buf[source+d]!=255 for d in [-1,1,-160,160]):frame.putpixel((x,y),palette[0])
            sheet.paste(frame,(index*64,0))
            if index==10:
                preview.paste(frame.resize((128,128),Image.Resampling.NEAREST),((level-1)*128,row*144),frame.resize((128,128),Image.Resampling.NEAREST))
                if mode=='idle':frame.save(out/f'form-{level}.png')
        sheet.save(out/f'{mode}-{level}.png')
(out/'metadata.json').write_text(json.dumps({'size':[64,64],'frames':20,'frame_ms':200,'anchor':[32,48],'states':list(data['states']),'levels':5,'palette':data['palette']},indent=2)+'\n')
preview.save(ROOT/'art/exports/motions-and-forms.png')
print('25 spritesheets, 5 evolution portraits, and animation contact sheet exported.')
