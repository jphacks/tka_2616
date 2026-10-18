# App audio

The originals supplied in the repository root are left untouched. Run
`python scripts/prepare_audio.py` to recreate the interface and character assets.
Requires ffmpeg. Files are mono 44.1 kHz MP3, normalized to -20 LUFS / -2 dBTP.

## Interface — Kenney

Source: https://kenney.nl/assets/interface-sounds
License: CC0, original text in `kenney-interface-LICENSE.txt`.

| File | Source |
| --- | --- |
| ui/tap.mp3 | click_001.ogg |
| ui/select.mp3 | select_001.ogg |
| ui/open.mp3 | open_001.ogg |
| ui/close.mp3 | close_001.ogg |
| ui/confirm.mp3 | confirmation_001.ogg |

## Character reactions — 効果音ラボ

User-provided downloads from https://soundeffect-lab.info/sound/anime/ .
Terms: https://soundeffect-lab.info/agreement/ (checked 2026-10-18).
These are app reaction sounds, not CC0 or a reusable sound pack.

| File | Supplied original | Used for |
| --- | --- | --- |
| pet/pet.mp3 | ぷよん.mp3 | Petting / bubbles |
| pet/complete.mp3 | 可愛く輝く1.mp3 | Task completion |
| pet/evolution.mp3 | 可愛く輝く2.mp3 | Evolution and fullscreen reveal |
| pet/wave.mp3 | 可愛い動作.mp3 | Waving |
| pet/dance.mp3 | 可愛い足音.mp3 | Dancing |
| pet/sleep.mp3 | 可愛く座る.mp3 | Settling down to sleep |

Other supplied sounds are not used yet. No failure/shock sound for uncertain AI results.

## Short spoken lines — VOICEVOX

Credit: VOICEVOX:ずんだもん
Software: https://voicevox.hiroshiba.jp/term/
Voice: https://zunko.jp/con_ongen_kiyaku.html
`voice/welcome.mp3`: おかえり。 / `voice/cheer.mp3`: やったね！
Generate with `scripts/generate_voicevox.py`; see metadata in `voice/`.
Only these two lines are spoken. The app does not contact a synthesis server.
Welcome waits for an enabled-sound user gesture, once per app mount. Cheer follows
completion/evolution sounds. All channels stop on mute, hiding the page, or closing
the evolution reveal. UI taps do not cut off character sounds or speech.
