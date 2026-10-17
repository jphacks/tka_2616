import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneInsets } from '../src/lib/sceneViewport.ts';
test('crop only the engine letterbox, including fractional phone DPR and odd centering', () => {
 for (const cssWidth of [320, 360, 375, 390, 414, 480]) for (const dpr of [1,1.25,1.5,2,2.625,2.75,3]) {
  const w=Math.round(cssWidth*dpr),h=Math.round(cssWidth*96/160*dpr);
  const [t,r,b,l]=sceneInsets(w,h).match(/[\d.]+/g)!.map(Number);
  const scale=Math.floor(Math.min(w/160,h/96));
  assert(Math.abs(w*(1-(l+r)/100)-160*scale)<1e-8);
  assert(Math.abs(h*(1-(t+b)/100)-96*scale)<1e-8);
  assert(Math.abs(w*l/100-((w-160*scale)>>1))<1e-8);
 }
});
