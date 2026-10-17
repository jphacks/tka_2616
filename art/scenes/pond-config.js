const W = 160, H = 96;
const FY = 86, POSE_STEP = 6;
const DEFAULT_MODE = 'idle', DEFAULT_LEVEL = 1, DEFAULT_NIGHT = false;
const options = new URLSearchParams(location.search);
const MODE = ['idle','happy','wave','sleep','grow','bubble','dance'].includes(options.get('mode')) ? options.get('mode') : DEFAULT_MODE;
const LEVEL = Math.max(1, Math.min(5, Number(options.get('level')) || DEFAULT_LEVEL));
const NIGHT = options.has('night') ? options.get('night') === '1' : DEFAULT_NIGHT;
// Ink, cream/sky, land, water, actor, blush, flowers, warm FX. 28 fixed colors.
const PAL = ['#46576e','#f5efdf','#e0edf1','#c9dfed','#b0cbde','#b3bf9d','#cdd4af','#e3dfbd','#82997f','#92b9d1','#abd3e5','#cce9ed','#eef5e8','#668baa','#8bb9d8','#b7dbed','#e1f1ed','#e5aaa9','#bd7d88','#dbc291','#f3dfab','#faf1d4','#6f8d72','#94ad86','#d7b3bf','#f0d3cd','#8895ad','#65778f'];
if (NIGHT) {
  PAL[1]='#b2b8ce'; PAL[2]='#778ba9'; PAL[3]='#7085a0'; PAL[4]='#607792';
  PAL[5]='#7e8d8d'; PAL[6]='#9aa79e'; PAL[7]='#b2b7a5';
  PAL[9]='#6f94b6'; PAL[10]='#8cb5cf'; PAL[11]='#b0d4df';
}
const LIGHTEN = Uint8Array.of(13,1,3,4,4,6,7,7,5,10,11,12,12,14,15,16,16,25,17,20,21,21,23,6,25,25,2,26);
const RAMPS = [Uint8Array.of(21,20,19,17),Uint8Array.of(12,11,10,9)];
const RIM = Uint8Array.of(15,16,12), RIM_BANDS = Uint16Array.of(8,16,24);
const RIM_OK = new Uint8Array(PAL.length); // Keep the fixed character outline; FX live outside it.
const AIR = new Uint8Array(PAL.length);
AIR[2]=AIR[3]=AIR[4]=1;
const LIGHT = Float32Array.of(-0.6,-0.8);
const DUR = Uint16Array.of(60,36,72,72);
const EASE = Uint16Array.of(6,30,6,60);
const EASE_OUT = Uint8Array.of(0,0,1,0);
// y, body stretch, right hand, expression (0 neutral / 1 smile / 2 sleep), sparkle, tilt
const NP = 6;
const REST = Float32Array.of(0,0,0,MODE==='sleep'?2:0,0,0);
const TARGET = [REST,Float32Array.of(1,-1,0,MODE==='sleep'?2:0,0,0),
 Float32Array.of(MODE==='happy'?-7:MODE==='grow'?-4:MODE==='sleep'?1:-1,MODE==='happy'?1:0,MODE==='wave'?5:MODE==='happy'?3:0,MODE==='sleep'?2:MODE==='happy'||MODE==='grow'||MODE==='dance'||MODE==='bubble'?1:0,MODE==='grow'?1:0,MODE==='wave'?1:0),REST];
// Stable row-table silhouette: 29px wide and 24px tall, shared across all forms.
const BODY = Int8Array.of(-5,5,-8,8,-10,10,-11,11,-12,12,-13,13,-13,13,-14,14,-14,14,-14,14,-14,14,-14,14,-14,14,-14,14,-14,14,-13,13,-13,13,-12,12,-11,11,-10,10,-8,8,-6,6);
let ax=80, ay=41, hand=0, face=0, blink=0, beat=0, shine=0;
let sway=0, ambient=0, playBeat=0, playActive=0;
// Task companions share timing and face anchors, but have their own silhouette and world.
const DEFAULT_CHARACTER = 'dishes';
const CHARACTER = ['dishes','ingredients','cooking','laundry'].includes(options.get('character')) ? options.get('character') : DEFAULT_CHARACTER;
if(CHARACTER==='ingredients') {PAL[13]='#a86b49';PAL[14]='#d29561';PAL[15]='#edbb7c';PAL[16]='#f5dbab';}
if(CHARACTER==='cooking') {PAL[13]='#8b687e';PAL[14]='#b78c9f';PAL[15]='#dcb1ba';PAL[16]='#f2d6cf';}
if(CHARACTER==='laundry') {PAL[13]='#b08749';PAL[14]='#dfb468';PAL[15]='#efd18b';PAL[16]='#fae8b9';}
