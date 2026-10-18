"""Import the user-provided downloads without modifying the originals. Requires ffmpeg."""
from pathlib import Path
from zipfile import ZipFile
import subprocess
import tempfile
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'frontend/public/audio'
PET = {'pet':'ぷよん', 'complete':'可愛く輝く1', 'evolution':'可愛く輝く2', 'wave':'可愛い動作', 'dance':'可愛い足音', 'sleep':'可愛く座る'}
UI = {'tap':'click_001', 'select':'select_001', 'open':'open_001', 'close':'close_001', 'confirm':'confirmation_001'}
def convert(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-vn','-af','loudnorm=I=-20:TP=-2:LRA=7','-ac','1','-ar','44100','-codec:a','libmp3lame','-q:a','4',str(target)],check=True)
if __name__ == '__main__':
    with ZipFile(ROOT / 'kenney_interface-sounds.zip') as archive, tempfile.TemporaryDirectory() as temporary:
        (OUT/'kenney-interface-LICENSE.txt').write_bytes(archive.read('License.txt'))
        for name, original in UI.items():
            source = Path(temporary)/f'{name}.ogg'
            source.write_bytes(archive.read(f'Audio/{original}.ogg'))
            convert(source, OUT/'ui'/f'{name}.mp3')
    for name, original in PET.items():
        convert(ROOT/f'{original}.mp3', OUT/'pet'/f'{name}.mp3')
    print('Imported 5 interface sounds and 6 character sounds; originals preserved.')
