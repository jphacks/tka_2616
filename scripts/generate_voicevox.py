"""Generate just two local phrases; the app never needs a running VOICEVOX engine.

Usage: python scripts/generate_voicevox.py --url http://127.0.0.1:50031
Start the official engine separately, stop it after generation.
Credit: VOICEVOX:ずんだもん
"""
import argparse
import json
from pathlib import Path
import tempfile
import urllib.parse
import urllib.request
from prepare_audio import convert

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:50021')
args = parser.parse_args()
base = args.url.rstrip('/')
def request(path, body=None, post=False):
    req = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None,
        headers={'Content-Type':'application/json'}, method='POST' if post else 'GET')
    with urllib.request.urlopen(req, timeout=120) as response:
        return response.read()

speakers = json.loads(request('/speakers'))
speaker = next(s for s in speakers if s['name'] == 'ずんだもん')
style = next(s for s in speaker['styles'] if s['name'] == 'ノーマル')
output = Path(__file__).resolve().parents[1] / 'frontend/public/audio/voice'
output.mkdir(parents=True, exist_ok=True)
metadata = {'engine_version':json.loads(request('/version')), 'credit':'VOICEVOX:ずんだもん',
    'speaker_uuid':speaker['speaker_uuid'], 'style':style, 'phrases':{}}
with tempfile.TemporaryDirectory() as tmp:
    for name, text in [('welcome','おかえり。'),('cheer','やったね！')]:
        params = urllib.parse.urlencode({'speaker':style['id'],'text':text})
        query = json.loads(request('/audio_query?' + params, post=True))
        query.update(speedScale=1.05, intonationScale=1.15, volumeScale=1.0,
                     prePhonemeLength=0.08, postPhonemeLength=0.12, outputStereo=False)
        wav = request('/synthesis?' + urllib.parse.urlencode({'speaker':style['id']}), query, post=True)
        if not wav.startswith(b'RIFF') or len(wav) < 1000:
            raise RuntimeError('Engine did not produce a valid WAV')
        source = Path(tmp)/f'{name}.wav'; source.write_bytes(wav)
        convert(source, output/f'{name}.mp3')
        metadata['phrases'][name] = {'text':text,'query':query}
        print(f'Generated {name}: {text}')
(output/'metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
