const pptxgen = require('pptxgenjs');
const path = require('node:path');
const fs = require('node:fs');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'くらしもん'; pptx.subject = 'JPHACKS 2026 東京A・90秒ピッチ';
pptx.title = '家事が、この子を育てる。'; pptx.company = 'JPHACKS project'; pptx.lang='ja-JP';
pptx.theme={headFontFace:'Noto Sans CJK JP',bodyFontFace:'Noto Sans CJK JP',lang:'ja-JP'};
const C={bg:'E0EDF1',ink:'334E68',blue:'446F93',gold:'E8C77E',paper:'FFF9EA'};
const assets='/tmp/yuruchara-pitch';
const output=path.resolve(__dirname,'../../deliverables/pitch');
function txt(s,text,x,y,w,h,size=24,color=C.ink,bold=false){s.addText(text,{x,y,w,h,fontFace:'Noto Sans CJK JP',fontSize:size,color,bold,margin:0,breakLine:false,vertAnchor:'mid',paraSpaceAfterPt:0});}
function img(s,file,x,y,w,h){const p=path.join(assets,file);const b=fs.readFileSync(p);const iw=b.readUInt32BE(16),ih=b.readUInt32BE(20);const scale=Math.min(w/iw,h/ih);const dw=iw*scale,dh=ih*scale;s.addImage({path:p,x:x+(w-dw)/2,y:y+(h-dh)/2,w:dw,h:dh});}
function slide(num){const s=pptx.addSlide();s.background={color:C.bg};txt(s,'JPHACKS 2026  /  TOKYO A',.65,.38,8,.3,12,C.blue);txt(s,`0${num}`,12.1,6.97,.55,.25,12,C.blue);return s;}
let s=slide(1);
txt(s,'家事が、\nこの子を育てる。',.65,1.35,8,2.1,48,C.ink,true);
txt(s,'「あとで洗おう」を、\n「この子に会いたい」に。',.69,4.05,7.2,1.25,27,C.blue);
txt(s,'あわもんと、暮らしのなかまたち',.69,6.25,8,.42,20,C.blue);
img(s,'awamon-2.png',8.2,1.4,4.3,4.6);
s.addNotes('目安 0〜25秒。\n「食器洗い、あとでやろう」と思って、ためてしまうこと、ありませんか？ 私たちは、面倒な家事を、キャラクターを育てる楽しみに変えるアプリを作りました。この子は、食器洗いで育つ「あわもん」です。\n[Sources]\nキャラ画像：frontend/public/assets/awamon/pixel/form-2.png（プロジェクト内の実装素材）。\n[/Sources]');
s=slide(2);
txt(s,'撮って、できた！で、育っていく。',.65,1.08,12,0.78,36,C.ink,true);
const cols=[.7,4.95,9.15];
['前後を撮る','変化を確認','なかまが育つ'].forEach((t,i)=>{txt(s,`0${i+1}`,cols[i],2.25,1,.5,22,C.blue,true);txt(s,t,cols[i],2.91,3.6,.55,27,C.ink,true);});
txt(s,'スマホで2枚、パシャリ。',.7,3.64,3.7,.7,18);
txt(s,'YOLOE：食器を検出\nGPT：前後の変化を確認',4.95,3.64,3.8,.9,18);
txt(s,'家事の記録が、成長に。',9.15,3.64,3.5,.7,18);
for(let i=0;i<2;i++)txt(s,'→',cols[i]+3.35,2.88,.6,.6,28,C.blue);
const chars=[['awamon','食器洗い'],['ingredients','食材活用'],['cooking','料理'],['laundry','洗濯']];
chars.forEach(([c,l],i)=>{const x=.75+i*3.0;img(s,`${c}-1.png`,x,5.05,1.25,1.25);txt(s,l,x+1.4,5.43,1.75,.5,20);});
s.addNotes('目安 25〜55秒。\n洗う前に一枚、終わったらもう一枚。YOLOEで食器を見つけ、GPTが前後の写真の変化を確認します。判断しきれないときは、自分で完了を記録できます。がんばった分だけ、姿や景色が育ちます。食材の活用、料理、洗濯にも、それぞれのなかまがいます。では、実際に動くところをご覧ください。\n[Sources]\n仕様：backend/app/detection.py、backend/app/vision.py、backend/app/tasks.py。YOLOEは食器洗いのみ。GPTへの写真送信は同意時のみ。\n画像：frontend/public/assets/{awamon,ingredients,cooking,laundry}/pixel/form-1.png。\n[/Sources]');
s=slide(3);
txt(s,'ひと洗い、ひと育ち。',.65,1.05,12,.8,40,C.ink,true);
const video=process.env.PITCH_VIDEO;
if(video){s.addMedia({type:'video',path:path.resolve(video),x:2.95,y:2.0,w:7.43,h:4.45,cover:path.join(assets,'pond.png')});}
else img(s,'pond.png',2.95,2.0,7.43,4.45);
txt(s,'「洗わなきゃ」が、ちょっと楽しみに。',.65,6.62,11.5,.5,24,C.blue,true);
s.addNotes('目安 55〜85秒。動画を最後に約25秒再生し、進化の余韻で締める。\n録画案：前写真・食器検出5秒 → 後写真・完了7秒 → 成長・進化8秒 → 喜ぶ様子5秒。通信待ちを編集する場合は動画内に「待機時間を短縮」と表示。実際に完了した操作を録画し、進化をデモ機能で起こす場合は「進化演出デモ」と明示する。\n締め：「洗わなきゃ」を「この子を育てたい」に。毎日の小さな家事を、ちょっと楽しみにします。\n動画未提供のため、現時点はアプリの実描画画像を表示。PowerPointの挿入→ビデオで画像位置に動画を置くか、PITCH_VIDEO=/absolute/path/demo.mp4 node tools/pitch/build.cjs で再生成。\n[Sources]\n実装の描画画像：art/qa/evolution/dishes/snap-126.png。\n[/Sources]');
fs.mkdirSync(output,{recursive:true});
pptx.writeFile({fileName:path.join(output,'kurashimon-90sec.pptx')});
