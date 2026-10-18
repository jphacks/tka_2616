"""Revise the user's annotated deck in-place at XML level, writing a new file."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from defusedxml.minidom import parseString

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'deliverables/pitch/kurashimon-90sec-animated.pptx'
OUT = ROOT / 'deliverables/pitch/kurashimon-90sec-revised.pptx'
with ZipFile(SRC) as z:
    files = {n: z.read(n) for n in z.namelist()}
slides = [parseString(files[f'ppt/slides/slide{i}.xml']) for i in range(1,5)]

def children(el, tag): return el.getElementsByTagName(tag)
def text(el): return ''.join(n.firstChild.data for n in children(el,'a:t') if n.firstChild)
def shape(doc, value): return next(el for el in children(doc,'p:sp') if text(el)==value)
def pos(el,x,y,w,h):
    off=children(el,'a:off')[0]; ext=children(el,'a:ext')[0]
    for k,v in [('x',x),('y',y)]: off.setAttribute(k,str(round(v*914400)))
    for k,v in [('cx',w),('cy',h)]: ext.setAttribute(k,str(round(v*914400)))
def wording(el,value,size=None,bold=None):
    body=children(el,'p:txBody')[0]
    paras=list(children(body,'a:p'))
    p=paras[0].cloneNode(True)
    rpr=children(el,'a:rPr')[0].cloneNode(True) if children(el,'a:rPr') else el.ownerDocument.createElement('a:rPr')
    if size: rpr.setAttribute('sz',str(size*100))
    if bold is not None: rpr.setAttribute('b','1' if bold else '0')
    for node in list(p.childNodes):
        if node.nodeName!='a:pPr': p.removeChild(node)
    r=el.ownerDocument.createElement('a:r'); r.appendChild(rpr)
    t=el.ownerDocument.createElement('a:t');t.appendChild(el.ownerDocument.createTextNode(value));r.appendChild(t);p.appendChild(r)
    for old in paras: body.removeChild(old)
    body.appendChild(p)
def remove(el): el.parentNode.removeChild(el)
def tree(doc): return children(doc,'p:spTree')[0]
next_id=900000

def copy_text(template,doc,value,x,y,w,h,size,bold=False):
    global next_id
    el=doc.importNode(template,True); next_id+=1
    children(el,'p:cNvPr')[0].setAttribute('id',str(next_id))
    children(el,'p:cNvPr')[0].setAttribute('name',f'Revised text {next_id}')
    wording(el,value,size,bold);pos(el,x,y,w,h);tree(doc).appendChild(el);return el

# Slide 1: retain the user's new title and character caption.
s1,s2,s3,s4=slides
base_header=shape(s1,'JPHACKS 2026  /  TOKYO A')
base_page=shape(s1,'01')
base_title=shape(s2,'撮って、できた！で、育っていく。')
wording(base_title,'食器洗いで、この子が育つ。',36,True)
wording(shape(s2,'なかまが育つ'),'あわもんが育つ',27,True)
remove(shape(s2,'この子は、食器洗いで育つ'))
remove(shape(s2,'進化の様子をここに'))
# Use the existing GIF picture as a template, preserving picture properties.
original_pic=children(s2,'p:pic')[0]
picture_template=original_pic.cloneNode(True);remove(original_pic)
relpath='ppt/slides/_rels/slide2.xml.rels'; rels=parseString(files[relpath])
for level in range(1,6):
    name=f'awamon-evolution-{level}.gif'
    image=(Path('/tmp/yuruchara-pitch')/name).read_bytes()
    files[f'ppt/media/{name}']=image
    rid=f'rIdEvolution{level}'
    rel=rels.createElement('Relationship');rel.setAttribute('Id',rid)
    rel.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/image')
    rel.setAttribute('Target',f'../media/{name}');rels.documentElement.appendChild(rel)
    pic=s2.importNode(picture_template,True); next_id+=1
    children(pic,'p:cNvPr')[0].setAttribute('id',str(next_id))
    children(pic,'p:cNvPr')[0].setAttribute('name',f'Awamon evolution level {level}')
    children(pic,'a:blip')[0].setAttribute('r:embed',rid)
    iw=int.from_bytes(image[6:8],'little'); ih=int.from_bytes(image[8:10],'little')
    scale=min(1.7/iw,1.55/ih);w,h=iw*scale,ih*scale
    x=.9+(level-1)*2.45
    pos(pic,x+(1.7-w)/2,4.9+(1.55-h)/2,w,h);tree(s2).appendChild(pic)
    copy_text(base_page,s2,f'Lv.{level}',x+.4,6.55,1.1,.35,16)
    if level<5: copy_text(base_page,s2,'→',x+1.95,5.45,.4,.45,24)
files[relpath]=rels.toxml(encoding='UTF-8')

# Slide 3: preserve the added characters and their embedded animations.
cs=children(s3,'p:cSld')[0]
for bg in list(children(cs,'p:bg')):remove(bg)
cs.insertBefore(s3.importNode(children(s1,'p:bg')[0],True),cs.firstChild)
copy_text(base_header,s3,'JPHACKS 2026  /  TOKYO A',.65,.38,8,.3,12)
copy_text(base_page,s3,'03',12.1,6.97,.55,.25,12)
old_title=shape(s3,'他の家事でも成長する仲間たちも！');remove(old_title)
copy_text(base_title,s3,'ほかの家事にも、育つなかま。',.65,1.08,12,.78,36,True)
for i,(pic,label,name) in enumerate(zip(list(children(s3,'p:pic')),['食材活用','料理','洗濯'],['べじもん','なべもん','ひなたもん'])):
    ext=children(pic,'a:ext')[0];iw=int(ext.getAttribute('cx'));ih=int(ext.getAttribute('cy'))
    scale=min(2.65/iw,2.65/ih);w,h=iw*scale,ih*scale;x=1.05+i*4.05
    pos(pic,x+(2.65-w)/2,2.35+(2.65-h)/2,w,h)
    item=shape(s3,label);pos(item,x,5.9,3,.5);wording(item,label,23)
    copy_text(base_title,s3,name,x,5.15,3.3,.6,29,True)
wording(shape(s4,'03'),'04',12)

notes=[
 '0〜20秒。「食器洗い、あとでやろう」と思って、ためてしまうこと、ありませんか？ 私たちは、家事でキャラクターを育てるアプリを作りました。食器洗いの妖精、あわもんです。',
 '20〜50秒。洗う前に一枚、終わったらもう一枚。YOLOEで食器を見つけ、GPTで前後の変化を確認します。写真だけでは分からないときは、自分で完了を記録できます。がんばりを重ねると、あわもんはこんな姿に進化します。休んでも弱らず、また会いに来られる相棒です。',
 '50〜60秒。食材の活用でべじもん、料理でなべもん、洗濯でひなたもん。暮らしの家事に、それぞれのなかまがいます。最後に、動くところをご覧ください。',
 '60〜85秒。操作動画を約20秒再生し、最後の5秒で締める。「洗わなきゃ」を「この子を育てたい」に。毎日の小さな家事を、ちょっと楽しみにします。動画はまだ未挿入。現在の池の画像を差し替える。待ち時間を編集したら明記し、進化デモ機能を使う場合も明記。残り5秒は余裕。'
]
source='\n[Sources]\n画像・GIF：プロジェクト内 frontend/public/assets/*/pixel/ と art/qa/evolution/dishes/snap-126.png。仕様：backend/app/detection.py、vision.py、tasks.py。YOLOEは食器洗いのみ。GPTへの写真送信は同意時。\n[/Sources]'
for i,doc in enumerate(slides,1):
    files[f'ppt/slides/slide{i}.xml']=doc.toxml(encoding='UTF-8')
    np=f'ppt/notesSlides/notesSlide{i}.xml';nd=parseString(files[np])
    body=next((sp for sp in children(nd,'p:sp') if any(ph.getAttribute('type')=='body' for ph in children(sp,'p:ph'))),None)
    if body is not None: wording(body,notes[i-1]+source,12)
    files[np]=nd.toxml(encoding='UTF-8')
# Repair inherited notes-master ordering flagged by the PPTX validator.
pres=parseString(files['ppt/presentation.xml'])
master=children(pres,'p:notesMasterIdLst')[0]
slide_ids=children(pres,'p:sldIdLst')[0]
master.parentNode.removeChild(master)
pres.documentElement.insertBefore(master,slide_ids.nextSibling)
files['ppt/presentation.xml']=pres.toxml(encoding='UTF-8')
with ZipFile(OUT,'w',ZIP_DEFLATED) as z:
    for name,data in files.items():z.writestr(name,data)
print(OUT)
