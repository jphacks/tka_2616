"""Four reproducible, unapproved 64px design studies; no animation masters."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/candidates'
PUBLIC = ROOT / 'frontend/public/assets/candidates'
PAL = {'outline': '#40677C', 'shadow': '#63BCD4', 'body': '#9DE5E7', 'light': '#D5FCF1', 'shine': '#FFFEED', 'blush': '#F5A3A5', 'eyes': '#35495D', 'mouth': '#9B5874', 'leaf': '#89B68B'}

def make(kind):
    im = Image.new('RGBA', (64, 64)); d = ImageDraw.Draw(im)
    if kind == 'a':
        outline = [(31,8),(35,14),(42,20),(48,27),(52,36),(51,44),(46,51),(38,55),(24,55),(16,51),(11,44),(11,34),(15,26),(23,19),(28,13)]
        d.polygon(outline, fill=PAL['outline'])
        d.polygon([(31,13),(36,19),(43,25),(48,33),(49,41),(45,48),(37,52),(25,52),(18,48),(14,41),(14,34),(18,28),(25,22)],fill=PAL['body'])
        d.polygon([(31,16),(35,21),(24,29),(20,37),(17,34),(22,26)],fill=PAL['light'])
    elif kind == 'b':
        for box in [(19,10,33,24),(32,6,46,21)]:
            d.ellipse(box,fill=PAL['outline']);d.ellipse(tuple(v+(2 if i<2 else -2) for i,v in enumerate(box)),fill=PAL['light'])
        d.ellipse((10,20,53,55),fill=PAL['outline']);d.ellipse((13,22,50,52),fill=PAL['body']);d.ellipse((17,24,45,36),fill=PAL['light'])
    elif kind == 'c':
        d.ellipse((7,27,56,57),fill=PAL['outline']);d.ellipse((10,29,53,54),fill=PAL['body']);d.ellipse((16,30,46,39),fill=PAL['light'])
        d.rectangle((16,52,48,56),fill=PAL['outline']);d.rectangle((17,51,47,53),fill=PAL['shadow'])
    else:
        d.polygon([(29,22),(27,13),(20,9),(20,15),(25,22)],fill=PAL['outline']);d.polygon([(31,21),(34,11),(44,10),(40,18)],fill=PAL['leaf'])
        d.ellipse((14,21,49,53),fill=PAL['outline']);d.ellipse((17,23,46,50),fill=PAL['body']);d.ellipse((20,24,43,35),fill=PAL['light'])
        for box in [(17,49,26,57),(37,49,46,57),(9,35,18,44),(46,35,55,44)]:
            d.ellipse(box,fill=PAL['outline']);d.ellipse(tuple(v+(2 if i<2 else -2) for i,v in enumerate(box)),fill=PAL['body'])
    y = 39 if kind == 'c' else 34
    for x in (23,37):
        d.rectangle((x,y,x+3,y+5),fill=PAL['eyes']);d.point((x,y),fill=PAL['shine'])
    for x in (17,42):d.rectangle((x,y+6,x+4,y+7),fill=PAL['blush'])
    d.line([(29,y+7),(31,y+9),(33,y+9),(35,y+7)],fill=PAL['mouth'],width=1)
    d.rectangle((20,29 if kind!='c' else 33,24,30 if kind!='c' else 34),fill=PAL['shine'])
    return im

def main():
    OUT.mkdir(parents=True,exist_ok=True);PUBLIC.mkdir(parents=True,exist_ok=True)
    sheet=Image.new('RGB',(1024,700),'#F7F8F0');draw=ImageDraw.Draw(sheet)
    for i, kind in enumerate('abcd'):
        im=make(kind)
        assert im.size==(64,64)
        assert len({color for color in im.getdata() if color[3]})<=16
        assert im.getpixel((0,0))[3]==0
        im.save(OUT/f'{kind}.png');im.save(PUBLIC/f'{kind}.png')
        im.resize((512,512),Image.Resampling.NEAREST).save(OUT/f'{kind}-8x.png')
        alpha=im.getchannel('A');sil=Image.new('RGBA',im.size,PAL['outline']);sil.putalpha(alpha);sil.save(OUT/f'{kind}-silhouette.png')
        face=im.crop((14,28,49,49)).resize((280,168),Image.Resampling.NEAREST);face.save(OUT/f'{kind}-face.png')
        x=i*256
        draw.text((x+20,20),f'{kind.upper()} / DESIGN STUDY',fill=PAL['outline'])
        sheet.paste(im.resize((256,256),Image.Resampling.NEAREST),(x,45),im.resize((256,256),Image.Resampling.NEAREST))
        small=im.resize((48,48),Image.Resampling.NEAREST);sheet.paste(small,(x+100,325),small)
        sil=sil.resize((128,128),Image.Resampling.NEAREST);sheet.paste(sil,(x+64,405),sil)
        face=face.resize((224,134),Image.Resampling.NEAREST);sheet.paste(face,(x+16,550),face)
    sheet.save(OUT/'comparison.png');sheet.save(PUBLIC/'comparison.png')
    (OUT/'palette.json').write_text(json.dumps(PAL,indent=2)+'\n')
    print('4 candidates: 64x64, transparent, <=16 colors. NOT APPROVED.')

if __name__=='__main__':main()
