function buildCompanionBackground() {
 bg.fill(1);
 if(CHARACTER==='laundry') {
  rect(bg,0,0,W,65,2);rect(bg,0,65,W,31,7);
  rect(bg,0,63,W,2,5);cloud(bg,18,16);cloud(bg,116,22);
  if(NIGHT){disc(133,12,5,21,bg);disc(135,10,4,2,bg);}
  line(bg,9,31,151,31,8);rect(bg,10,30,2,34,8);rect(bg,148,30,2,34,8);
  // Quiet laundry hanging behind the sun.
  if(LEVEL>=2){rect(bg,22,32,17,18,11);hline(bg,22,38,48,9);rect(bg,24,30,2,4,19);rect(bg,35,30,2,4,19);}
  if(LEVEL>=3){rect(bg,117,33,15,16,25);hline(bg,117,131,46,17);rect(bg,119,30,2,5,19);rect(bg,129,30,2,5,19);}
  if(LEVEL>=4){flower(bg,24,74,24);flower(bg,137,77,25);leaf(bg,25,81);leaf(bg,135,84);}
  rect(bg,117,73,20,12,19);rect(bg,119,71,16,5,12);
  for(let i=0;i<4;i++)rect(bg,119+i*5,76,2,7,7);
  if(LEVEL>=5){cloud(bg,67,14);flower(bg,45,81,25);flower(bg,113,86,24);}
 } else {
  // Warm kitchen with window, tiled wall, and a task-specific worktop.
  rect(bg,0,56,W,40,7);rect(bg,0,56,W,4,19);
  for(let y=40;y<56;y+=8)hline(bg,0,159,y,7);
  for(let x=0;x<160;x+=16)rect(bg,x,40,1,16,7);
  rect(bg,58,8,45,27,19);rect(bg,60,10,41,23,2);rect(bg,80,10,2,23,19);hline(bg,60,100,22,19);
  if(NIGHT){disc(91,16,4,21,bg);disc(93,14,3,2,bg);}else{cloud(bg,64,18);disc(92,16,3,20,bg);}
  if(CHARACTER==='ingredients') {
   rect(bg,10,14,26,42,26);rect(bg,12,16,22,38,12);hline(bg,12,33,33,26);rect(bg,29,22,2,6,13);rect(bg,29,39,2,6,13);
   rect(bg,117,43,27,13,19);hline(bg,119,141,47,7);hline(bg,119,141,52,7);
   disc(125,42,5,23,bg);leaf(bg,126,40);disc(136,43,4,17,bg);
   if(LEVEL>=2){rect(bg,45,51,7,5,19);leaf(bg,48,50);}
   if(LEVEL>=3){rect(bg,115,17,29,3,19);rect(bg,119,9,6,8,11);rect(bg,132,8,7,9,25);}
   if(LEVEL>=4){flower(bg,49,46,24);flower(bg,137,36,25);}
   if(LEVEL>=5){rect(bg,12,70,24,12,19);disc(18,70,4,23,bg);disc(28,70,4,17,bg);}
  } else {
   rect(bg,12,40,27,16,26);rect(bg,14,42,23,11,12);rect(bg,17,45,6,5,9);rect(bg,28,45,6,5,9);
   rect(bg,119,41,25,15,19);rect(bg,121,43,9,10,7);rect(bg,133,43,9,10,7);
   if(LEVEL>=2){rect(bg,45,15,3,17,19);disc(46,14,3,19,bg);}
   if(LEVEL>=3){rect(bg,117,19,26,3,19);rect(bg,121,10,6,9,11);rect(bg,132,12,6,7,25);}
   if(LEVEL>=4){steppedOval(bg,130,65,11,3,12);disc(129,63,4,23,bg);disc(135,63,2,17,bg);}
   if(LEVEL>=5){flower(bg,22,24,24);leaf(bg,22,33);rect(bg,18,32,9,8,19);}
  }
 }
 // All companions have a little mat, with a brighter stage as their world grows.
 steppedOval(bg,80,72,28+LEVEL,7,19);steppedOval(bg,80,70,27+LEVEL,6,1);
}
function drawCompanion() {
 if(CHARACTER==='ingredients') {
  // Each stage changes the silhouette: root, sprout, leaf cloak, bloom, harvest spirit.
  if(LEVEL===3){steppedOval(spr,ax-12,ay+12,10,13,22);steppedOval(spr,ax+12,ay+12,10,13,23);}
  if(LEVEL===4){for(let i=0;i<8;i++){const a=i*Math.PI/4;disc(ax+Math.round(Math.cos(a)*16),ay+9+Math.round(Math.sin(a)*16),6,25,spr);}}
  if(LEVEL===5){steppedOval(spr,ax,ay+13,23,15,22);steppedOval(spr,ax,ay+11,21,13,23);leaf(spr,ax-19,ay+3);leaf(spr,ax+17,ay+4);}
  // Rounded carrot with stage-specific root proportions.
  for(let row=0;row<26;row++) {
   const half=LEVEL===1 ? (row<5?6+row:Math.max(1,11-Math.max(0,row-10))) : LEVEL===4 ? Math.max(3,Math.floor(13*Math.sqrt(Math.max(0,1-((row-12)/14)**2)))) : row<5?8+row:row<14?13:Math.max(2,13-(row-13));
   for(let x=-half;x<=half;x++)plot(spr,ax+x,ay+row,x>7||row>20?14:x<0&&row<11?16:15);
  }
  rect(spr,ax-17,ay+12,5,4,14);rect(spr,ax+13,ay+12-hand,5,4,14);
  leaf(spr,ax,ay);leaf(spr,ax-4,ay-1);line(spr,ax-2,ay-1,ax-8,ay-7,22);hline(spr,ax-10,ax-5,ay-7,23);
  hline(spr,ax-5,ax-2,ay+21,13);
  if(LEVEL>=2)leaf(spr,ax+3,ay-2);
  if(LEVEL>=3){rect(spr,ax-10,ay+18,21,2,23);rect(spr,ax+8,ay+19,3,4,23);}
  if(LEVEL>=4)flower(spr,ax-7,ay-3,25);
  if(LEVEL>=5){flower(spr,ax+4,ay-5,21);plot(spr,ax,ay+19,21);}
 } else if(CHARACTER==='cooking') {
  // Pot grows into a steamer, a round casserole, then a tiny walking kitchen.
  if(LEVEL===5){rect(spr,ax-23,ay+17,47,12,19);rect(spr,ax-21,ay+19,43,8,1);disc(ax-16,ay+29,3,13,spr);disc(ax+16,ay+29,3,13,spr);rect(spr,ax-23,ay-12,3,30,19);rect(spr,ax+21,ay-12,3,30,19);rect(spr,ax-25,ay-15,51,5,17);for(let i=0;i<5;i++)rect(spr,ax-25+i*10,ay-15,5,5,12);}
  if(LEVEL===3){rect(spr,ax-13,ay-8,27,10,19);hline(spr,ax-13,ax+13,ay-5,13);hline(spr,ax-13,ax+13,ay-1,13);for(let i=0;i<5;i++)rect(spr,ax-10+i*5,ay-7,2,2,21);}
  if(LEVEL===4){steppedOval(spr,ax,ay+12,20,14,14);steppedOval(spr,ax-2,ay+10,17,12,15);}
  // Face stays on the pot, never the lid.
  rect(spr,ax-14,ay+4,29,15,15);rect(spr,ax-12,ay+19,25,3,14);
  rect(spr,ax-14,ay+4,5,13,16);hline(spr,ax-12,ax+12,ay+4,16);
  rect(spr,ax-20,ay+9,6,5,13);rect(spr,ax-19,ay+10,4,2,16);
  rect(spr,ax+15,ay+9-hand,6,5,13);rect(spr,ax+16,ay+10-hand,4,2,16);
  rect(spr,ax-16,ay+1,33,3,13);rect(spr,ax-13,ay-1,27,3,15);rect(spr,ax-3,ay-4,7,3,13);
  if(LEVEL>=2){line2(spr,ax-19,ay+11,ax-22,ay-2,19,13);disc(ax-22,ay-3,2,19,spr);}
  if(LEVEL===4){rect(spr,ax-6,ay-9,13,6,12);disc(ax-5,ay-10,3,12,spr);disc(ax+1,ay-12,4,12,spr);disc(ax+6,ay-10,3,12,spr);hline(spr,ax-5,ax+5,ay-5,11);}
  if(LEVEL>=4){rect(spr,ax-9,ay+19,19,2,19);plot(spr,ax,ay+19,21);}
  if(LEVEL>=5){flower(spr,ax+11,ay+2,21);hline(spr,ax-13,ax+12,ay+21,19);}
 } else {
  // Cloud rider, rainbow wings, flower sun, and a radiant sky guardian.
  if(LEVEL===2){disc(ax-12,ay+23,7,11,spr);disc(ax+12,ay+23,7,11,spr);steppedOval(spr,ax,ay+25,20,5,12);}
  if(LEVEL===3){for(let side=-1;side<=1;side+=2){steppedOval(spr,ax+side*18,ay+12,10,11,24);steppedOval(spr,ax+side*18,ay+13,8,8,20);steppedOval(spr,ax+side*18,ay+14,6,5,11);}}
  if(LEVEL>=4){for(let i=0;i<10;i++){const a=i*Math.PI/5;disc(ax+Math.round(Math.cos(a)*18),ay+10+Math.round(Math.sin(a)*18),LEVEL===4?5:3,LEVEL===4?20:12,spr);}}
  // Soft sun with a cream face.
  for(let i=0;i<8;i++) {
   const angle=i*Math.PI/4;
   const x=ax+Math.round(Math.cos(angle)*19),y=ay+10+Math.round(Math.sin(angle)*19);
   rect(spr,x-1,y-1,3,3,14);
  }
  disc(ax,ay+10,14,15,spr);disc(ax-3,ay+7,10,16,spr);
  rect(spr,ax-18,ay+12,5,4,14);rect(spr,ax+14,ay+12-hand,5,4,14);
  if(LEVEL>=2){hline(spr,ax-11,ax+11,ay+22,11);rect(spr,ax+9,ay+23,3,4,11);}
  if(LEVEL>=3){hline(spr,ax-9,ax+9,ay+22,24);hline(spr,ax-7,ax+7,ay+23,11);}
  if(LEVEL===4)flower(spr,ax-11,ay,25);
  if(LEVEL>=5){rect(spr,ax-6,ay-8,13,4,19);rect(spr,ax-6,ay-11,3,3,20);rect(spr,ax-1,ay-13,3,5,20);rect(spr,ax+4,ay-11,3,3,20);}
 }
 companionFace();
}
function companionFace() {
 rect(spr,ax-11,ay+14,4,2,17);rect(spr,ax+8,ay+14,4,2,17);
 if(face===2||blink){hline(spr,ax-7,ax-4,ay+12,0);hline(spr,ax+4,ax+7,ay+12,0);}
 else if(face===1){line(spr,ax-8,ay+12,ax-6,ay+10,0);line(spr,ax-6,ay+10,ax-4,ay+12,0);line(spr,ax+4,ay+12,ax+6,ay+10,0);line(spr,ax+6,ay+10,ax+8,ay+12,0);}
 else{rect(spr,ax-7,ay+9,3,5,0);rect(spr,ax+5,ay+9,3,5,0);plot(spr,ax-7,ay+9,12);plot(spr,ax+5,ay+9,12);}
 if(face===1){rect(spr,ax-2,ay+15,5,3,18);hline(spr,ax-1,ax+1,ay+18,17);}
 else{plot(spr,ax-2,ay+16,18);hline(spr,ax-1,ax+1,ay+17,18);plot(spr,ax+2,ay+16,18);}
}
function drawCompanionUnder() {
 steppedOval(buf,80,71,17,2,19);
 if(LEVEL>=5){
  if(CHARACTER==='ingredients'){disc(124,74,5,23);plot(buf,122,74,0);plot(buf,125,74,0);leaf(buf,124,69);}
  if(CHARACTER==='cooking'){rect(buf,119,70,11,8,15);rect(buf,130,71,3,5,14);plot(buf,122,74,0);plot(buf,126,74,0);}
  if(CHARACTER==='laundry'){cloud(buf,116,76);plot(buf,121,74,0);plot(buf,127,74,0);}
 }
}
