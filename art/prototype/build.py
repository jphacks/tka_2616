from PIL import Image, ImageDraw
from pathlib import Path
import math, json
OUT=Path(__file__).parent
S=64
PAL={'outline':'#40677C','shadow':'#63BCD4','body':'#9DE5E7','light':'#D5FCF1','shine':'#FFFFFF','blush':'#F5A3A5','eyes':'#35495D','mouth':'#9B5874','bubble':'#B0EBE9','highlight':'#EDFDF5'}
def frame(t, mode):
    im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    phase=2*math.pi*t/8
    joy=mode=='happy'
    bob=round((-3*abs(math.sin(phase/2))) if joy else math.sin(phase)*1)
    squash=2 if joy and t in (0,7) else (-2 if joy and t in (2,3) else 0)
    yy=bob+squash
    # back small bubble/ears to give signature silhouette
    d.ellipse((13,19+yy,24,31+yy),fill=PAL['outline']);d.ellipse((15,20+yy,23,29+yy),fill=PAL['body'])
    d.ellipse((41,14+yy,53,27+yy),fill=PAL['outline']);d.ellipse((43,16+yy,51,25+yy),fill=PAL['light'])
    # character silhouette stable
    d.ellipse((12,19+yy,51,53+yy-squash),fill=PAL['outline'])
    d.ellipse((14,20+yy,49,51+yy-squash),fill=PAL['body'])
    d.ellipse((16,22+yy,47,40+yy),fill=PAL['light'])
    d.polygon([(17,30+yy),(18,25+yy),(24,22+yy),(30,23+yy),(23,25+yy),(19,33+yy)],fill=PAL['shine'])
    d.rectangle((21,25+yy,24,27+yy),fill=PAL['shine'])
    d.ellipse((20,39+yy,43,50+yy-squash),fill=PAL['shadow'])
    # arms as flippers
    ax=4 if joy and t in (2,3,4,5) else 0
    d.ellipse((8-ax,36+yy-ax,18-ax,44+yy-ax),fill=PAL['outline']);d.ellipse((10-ax,37+yy-ax,17-ax,42+yy-ax),fill=PAL['body'])
    d.ellipse((46+ax,36+yy-ax,56+ax,44+yy-ax),fill=PAL['outline']);d.ellipse((47+ax,37+yy-ax,54+ax,42+yy-ax),fill=PAL['body'])
    # cheeks
    for x in [18,42]: d.rectangle((x,36+yy,x+5,38+yy),fill=PAL['blush'])
    # eyes and mouth
    blink=(not joy and t==5)
    if joy:
        d.line((22,34+yy,25,31+yy,28,34+yy),fill=PAL['eyes'],width=2)
        d.line((36,34+yy,39,31+yy,42,34+yy),fill=PAL['eyes'],width=2)
        d.ellipse((29,36+yy,35,41+yy),fill=PAL['mouth'])
        d.rectangle((31,40+yy,33,40+yy),fill=PAL['blush'])
    elif blink:
        d.line((22,33+yy,28,33+yy),fill=PAL['eyes'],width=2)
        d.line((36,33+yy,42,33+yy),fill=PAL['eyes'],width=2)
        d.line((30,38+yy,34,38+yy),fill=PAL['mouth'],width=2)
    else:
        for x in [23,37]:
            d.ellipse((x,30+yy,x+5,36+yy),fill=PAL['eyes'])
            d.rectangle((x+1,31+yy,x+2,32+yy),fill=PAL['shine'])
        d.line((30,38+yy,32,40+yy,34,38+yy),fill=PAL['mouth'],width=2)
    # decorative tiny floating bubbles, fixed per-frame geometry
    if joy:
        for k,(bx,by) in enumerate([(10,14),(49,8),(55,28)]):
            shift=(t*2+k*3)%9
            d.ellipse((bx,by-shift,bx+3,by-shift+3),outline=PAL['shadow'],width=1)
    return im
sets={}
for mode in ('idle','happy'):
    frames=[frame(t,mode) for t in range(8)]
    sets[mode]=frames
    frames[0].save(OUT/f'{mode}.png')
    scaled=[im.resize((256,256),Image.Resampling.NEAREST) for im in frames]
    scaled[0].save(OUT/f'awamon_{mode}.gif',save_all=True,append_images=scaled[1:],duration=[135]*8,loop=0,disposal=2,transparency=0,optimize=False)
    sheet=Image.new('RGBA',(S*8,S),(0,0,0,0))
    for t,img in enumerate(frames):sheet.paste(img,(t*S,0))
    sheet.save(OUT/f'awamon_{mode}_spritesheet.png')
    print(mode,'colors',len(set(c for f in frames for c in f.getdata() if c[3])))
# contact sheet on mint backing
contact=Image.new('RGB',(1024,590),'#E9F8F4'); c=ImageDraw.Draw(contact)
for j,mode in enumerate(('idle','happy')):
    c.text((24,18+282*j),f'AWAMON  /  {mode.upper()}  /  8 FRAMES',fill='#40677C')
    for t,im in enumerate(sets[mode]):
        tile=Image.new('RGBA',(128,128),'#F8FEFD')
        tile.alpha_composite(im.resize((128,128),Image.Resampling.NEAREST))
        contact.paste(tile.convert('RGB'),(t*128,42+282*j))
        c.text((t*128+53,178+282*j),f'{t+1:02d}',fill='#577A87')
contact.save(OUT/'preview.png')
(OUT/'metadata.json').write_text(json.dumps({'size':[64,64],'frames':8,'frame_ms':135,'animations':['idle','happy'],'palette':PAL},indent=2))
