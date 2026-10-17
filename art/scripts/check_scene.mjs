// Deterministic engine checks without a browser; scene engine itself is not edited.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const character=process.argv[2] || 'dishes';
assert(['dishes','ingredients','cooking','laundry'].includes(character));
const sceneFile=character==='dishes'?'awamon-pond':`${character}-world`;
const html=readFileSync(resolve(root,`frontend/public/scenes/${sceneFile}.html`),'utf8');
const template=readFileSync(resolve(root,'.agents/skills/pixel-anims/assets/wizard-spellcaster.html'),'utf8');
const regions=s=>new Map([...s.matchAll(/\/\/ #region (ENGINE[^\n]*)\n([\s\S]*?)\/\/ #endregion/g)].map(m=>[m[1],m[2]]));
for(const [name,value] of regions(template))assert.equal(regions(html).get(name),value,`${name} must stay intact`);
const script=html.match(/<script>([\s\S]*)<\/script>/)[1].replace(/\/\/ #region ENGINE boot[\s\S]*?\/\/ #endregion/,`checkContract();buildBackground();globalThis.qa={update,render,getSprite:()=>Array.from(spr),getBuffer:()=>Array.from(buf),palette:PAL,loop:DUR.reduce((a,b)=>a+b),getParticles:()=>Array.from(pLife).filter(v=>v>0).length};`);
function scene(mode,level,night,reduced=false){
 const context2d={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},fillRect(){},drawImage(){}};
 const context={URLSearchParams,Uint8Array,Uint8ClampedArray,Uint16Array,Int8Array,Int16Array,Int32Array,Uint32Array,Float32Array,Float64Array,Math,console,location:{search:`?mode=${mode}&level=${level}&night=${night?1:0}`,hash:''},matchMedia:()=>({matches:reduced}),document:{getElementById:()=>({getContext:()=>context2d}),createElement:()=>({getContext:()=>context2d})}};
 vm.runInNewContext(script,context);return context.qa;
}
let checks=0;
for(const mode of ['idle','happy','wave','sleep','grow','bubble','dance'])for(let level=1;level<=5;level++)for(const night of [false,true]){
 const s=scene(mode,level,night);let first;let changed=false;
 for(let tick=0;tick<=s.loop;tick++){
  s.update();s.render();const sprite=s.getSprite();
  if(tick===0)first=sprite;
  if(tick===126)changed=JSON.stringify(sprite)!==JSON.stringify(first);
  assert(s.getBuffer().every(c=>c<s.palette.length),'palette range');
  assert(s.getParticles()<=20,'bounded particles');
  if(tick===s.loop)assert.deepEqual(sprite,first,`loop seam ${mode} ${level}`);
 }
 assert(changed,`action changes pose ${mode}`);
 checks++;
}
const calm=scene('grow',5,false,true);let baseline;
for(let tick=0;tick<240;tick++) {calm.update();calm.render();if(tick===0)baseline=calm.getBuffer();else assert.deepEqual(calm.getBuffer(),baseline,'reduced motion is static');}
// Export generated sprite buffers for the React dialog sprite and static evolution previews.
// PNG encoding is done by Pillow using these original index buffers (no screenshot manipulation).
const frames={palette:scene('idle',1,false).palette,states:{}};
for(const mode of ['idle','happy','wave','sleep','grow','bubble','dance']){
 frames.states[mode]=[];
 for(let level=1;level<=5;level++){
  const s=scene(mode,level,false);const poses=[];
  for(let tick=0;tick<240;tick++){s.update();s.render();if(tick%12===0)poses.push(s.getSprite());}
  frames.states[mode].push(poses);
 }
}
mkdirSync(resolve(root,'art/exports'),{recursive:true});
writeFileSync(resolve(root,`art/exports/frames-${character}.json`),JSON.stringify(frames));
console.log(`${character}: ${checks} mode/level/day-night combinations: palette, particle budget, distinct pose, loop seam passed. Reduced-motion: static. Exported sprites.`);
