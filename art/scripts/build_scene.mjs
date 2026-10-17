import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const temp=mkdtempSync(join(tmpdir(),'awamon-scene-'));
try {
 const output=join(temp,'scene.html');
 execFileSync(process.execPath,[join(root,'.agents/skills/pixel-anims/scripts/new-scene.mjs'),output]);
 let html=readFileSync(output,'utf8');
 for(const kind of ['config','logic'])html=html.replace(new RegExp('(// #region SCENE '+kind+'\\n)[\\s\\S]*?(// #endregion)'),(_,a,b)=>a+readFileSync(join(root,'art/scenes/pond-'+kind+'.js'),'utf8')+b);
 html=html.replace('<title>TODO</title>','<title>あわもんの小さな池</title>').replace('aria-label="TODO"','aria-label="水色の妖精あわもんと、花や仲間が増えるピクセルの池"').replaceAll('#0b0913','#46576e').replace('color-scheme: dark','color-scheme: light');
 writeFileSync(join(root,'frontend/public/scenes/awamon-pond.html'),html);
 console.log('Built self-contained scene; all pixel-anims ENGINE regions unchanged.');
} finally {rmSync(temp,{recursive:true,force:true});}
