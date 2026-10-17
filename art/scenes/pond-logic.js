function steppedOval(t,cx,cy,rx,ry,color) {
  for(let y=-ry;y<=ry;y++) {
    const half=Math.floor(rx*Math.sqrt(Math.max(0,1-y*y/(ry*ry))));
    hline(t,cx-half,cx+half,cy+y,color);
  }
}
function flower(t,x,y,c) {
  rect(t,x-1,y-3,3,7,c);rect(t,x-3,y-1,7,3,c);plot(t,x,y,20);
}
function tree(t,x,y,size) {
  rect(t,x-1,y,3,10,8);
  steppedOval(t,x,y-4,size,size,8);
  steppedOval(t,x-2,y-6,size-1,size-2,5);
  hline(t,x-3,x+1,y-size-3,6);
}
function cloud(t,x,y) {
  rect(t,x,y,18,3,12);rect(t,x+3,y-3,11,3,12);rect(t,x+6,y-5,5,2,12);
}
function leaf(t,x,y) {
  line(t,x,y,x+4,y-6,22);hline(t,x+1,x+6,y-5,23);hline(t,x+2,x+6,y-6,23);hline(t,x+3,x+5,y-7,6);
}
function buildBackground() {
  bg.fill(2);rect(bg,0,24,W,15,3);rect(bg,0,39,W,57,6);
  // Soft stepped ridges; no smooth vectors or dither over the whole field.
  for(let x=0;x<W;x++) {
    const ridge=33+Math.round(Math.sin(x/19)*3);
    rect(bg,x,ridge,1,11,5);
    rect(bg,x,ridge+7,1,5,6);
  }
  if(NIGHT) {
    disc(130,16,6,21,bg);disc(133,14,5,2,bg);
    for(let i=0;i<15;i++)plot(bg,(i*37+11)%160,(i*11+5)%30,12);
  } else {disc(130,16,6,20,bg);hline(bg,128,132,12,21);cloud(bg,18,18);cloud(bg,90,10);}
  rect(bg,0,78,W,18,7);
  for(let i=0;i<38;i++) {
    const x=(i*43+9)%160,y=44+(i*17)%48;
    hline(bg,x,x+2,y,5);plot(bg,x+1,y-1,5);
  }
  tree(bg,16,42,10);tree(bg,144,48,12);tree(bg,3,58,8);
  const rx=LEVEL===1?35:LEVEL===2?42:49;
  steppedOval(bg,81,69,rx+3,18,5);steppedOval(bg,81,66,rx+2,18,8);
  steppedOval(bg,81,65,rx,17,9);steppedOval(bg,81,63,rx-2,14,10);
  steppedOval(bg,78,60,rx-8,9,11);
  hline(bg,56,63,64,12);hline(bg,101,110,69,11);hline(bg,71,86,77,11);
  rect(bg,31,75,7,4,26);rect(bg,32,73,5,3,1);
  rect(bg,125,79,9,4,26);rect(bg,126,77,6,3,1);
  flower(bg,23,68,25);flower(bg,137,60,21);
  if(LEVEL>=2) {steppedOval(bg,54,70,6,2,23);hline(bg,55,59,69,6);steppedOval(bg,110,57,6,2,23);}
  if(LEVEL>=3) {leaf(bg,41,60);leaf(bg,40,65);leaf(bg,121,62);leaf(bg,119,60);}
  if(LEVEL>=4) {flower(bg,53,67,24);flower(bg,111,54,25);flower(bg,25,82,24);flower(bg,141,81,25);}
  if(LEVEL>=5) {
    // A tiny duck house at the bank.
    rect(bg,119,35,16,14,19);rect(bg,117,33,20,3,18);rect(bg,120,30,14,3,18);rect(bg,123,27,8,3,18);
    rect(bg,125,40,5,9,0);rect(bg,120,38,3,3,21);
  }
  sample();
}
function step() {
  if(tick%POSE_STEP===0)sample();
  if(!calm && MODE==='grow' && state===2 && stT===6) {
    for(let i=0;i<20;i++) {
      const angle=rand()*Math.PI*2;
      spawn(BURST,32+Math.floor(rand()*16),ax+Math.round(Math.cos(angle)*20),ay+10+Math.round(Math.sin(angle)*15),Math.cos(angle)*0.6,-0.6-rand()*0.6,0);
    }
  }
  if(!calm && MODE==='happy' && state===2 && stT===6) {
    for(let i=0;i<8;i++)spawn(MOTE,30,ax-19+i*5,ay+3,0,-0.18,1);
  }
}
function sample() {
  snap.set(pose);
  ax=80+Math.round(snap[5]);
  ay=41+Math.round(snap[0]);
  hand=Math.round(snap[2]);face=Math.round(snap[3]);shine=Math.round(snap[4]*4);
  beat=Math.floor((tick+240)%240/6);blink=beat===7||beat===8;
  sway=Math.round(Math.sin((tick+240)%240*Math.PI/120));
  ambient=Math.floor(((tick+240)%240)/24);
  if(calm){ay=41;hand=MODE==='wave'?5:0;face=MODE==='sleep'?2:MODE==='happy'||MODE==='grow'?1:0;shine=0;sway=0;blink=0;ambient=0;}
  srcX=ax;srcY=ay-5;rim=0;
}
function drawActor() {
  // Short arms, closed silhouette, cream highlight from upper left.
  rect(spr,ax-18,ay+12,6,5,14);rect(spr,ax+13,ay+12-hand,6,5,14);
  hline(spr,ax-17,ax-15,ay+12,16);hline(spr,ax+15,ax+17,ay+12-hand,16);
  // Signature two foam bubbles preserve the original prototype's identity.
  disc(ax-8,ay,4,14,spr);disc(ax+7,ay-4,4,15,spr);hline(spr,ax+6,ax+8,ay-6,16);
  for(let row=0;row<BODY.length/2;row++) {
    const left=BODY[row*2],right=BODY[row*2+1];
    for(let x=left;x<=right;x++) {
      let c=15;
      if(row>15 || x>10)c=14;
      else if(row<9 && x<6)c=16;
      plot(spr,ax+x,ay+row,c);
    }
  }
  hline(spr,ax-8,ax-4,ay+4,12);hline(spr,ax-10,ax-8,ay+5,12);
  rect(spr,ax-11,ay+14,4,2,17);rect(spr,ax+8,ay+14,4,2,17);
  if(face===2 || blink) {hline(spr,ax-7,ax-4,ay+12,0);hline(spr,ax+4,ax+7,ay+12,0);}
  else if(face===1) {
    line(spr,ax-8,ay+12,ax-6,ay+10,0);line(spr,ax-6,ay+10,ax-4,ay+12,0);
    line(spr,ax+4,ay+12,ax+6,ay+10,0);line(spr,ax+6,ay+10,ax+8,ay+12,0);
  } else {rect(spr,ax-7,ay+9,3,5,0);rect(spr,ax+5,ay+9,3,5,0);plot(spr,ax-7,ay+9,12);plot(spr,ax+5,ay+9,12);}
  if(face===1){rect(spr,ax-2,ay+15,5,3,18);hline(spr,ax-1,ax+1,ay+18,17);}
  else if(face===2){hline(spr,ax-1,ax+1,ay+17,18);}
  else {plot(spr,ax-2,ay+16,18);hline(spr,ax-1,ax+1,ay+17,18);plot(spr,ax+2,ay+16,18);}
  if(LEVEL>=2)leaf(spr,ax-1,ay-1);
  if(LEVEL>=3){leaf(spr,ax-4,ay-2);line(spr,ax-3,ay-5,ax-8,ay-8,22);hline(spr,ax-9,ax-5,ay-8,23);}
  if(LEVEL>=4){flower(spr,ax-7,ay-2,24);flower(spr,ax+1,ay-4,25);flower(spr,ax+9,ay-1,21);}
  if(LEVEL>=5){rect(spr,ax-10,ay+20,21,2,19);plot(spr,ax,ay+20,21);}
}
function drawUnder() {
  // Contact ripple and slow water glints stay separate from the character.
  hline(buf,ax-15,ax+15,67,9);hline(buf,ax-11,ax+11,68,11);
  hline(buf,42+ambient,47+ambient,62,12);hline(buf,102-ambient,108-ambient,72,12);
  if(LEVEL>=4) {rect(buf,103+sway*2,66,4,2,17);plot(buf,108+sway*2,65,18);plot(buf,108+sway*2,68,18);}
  if(LEVEL>=5) {
    steppedOval(buf,115,73+sway,6,4,15);rect(buf,111,68+sway,7,5,16);
    plot(buf,112,71+sway,0);plot(buf,116,71+sway,0);hline(buf,113,115,74+sway,18);
  }
}
function drawOver() {
  drawParticles(false);drawParticles(true);
  if(face===2) {
    const x=ax+20,y=ay-2-sway;
    hline(buf,x,x+3,y,12);line(buf,x+3,y,x,y+3,12);hline(buf,x,x+3,y+3,12);
    hline(buf,x+7,x+11,y-7,12);line(buf,x+11,y-7,x+7,y-3,12);hline(buf,x+7,x+11,y-3,12);
  }
  if(shine>0) {
    const r=18+shine;
    line(buf,ax-r,ay+4,ax-r,ay+8,21);line(buf,ax-r-2,ay+6,ax-r+2,ay+6,21);
    line(buf,ax+r,ay-2,ax+r,ay+2,21);line(buf,ax+r-2,ay,ax+r+2,ay,21);
  }
}
