#!/usr/bin/env python3
"""Озвучка ролика: синтез реплик из voice_text.txt (RHVoice), подгонка под отрезки, сведение с видео.

  apt-get install rhvoice rhvoice-russian ffmpeg
  python3 voiceover.py input.mp4 output.mp4 [голос=aleksandr-hq]
"""
import os, re, subprocess, sys, tempfile

video, result = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else 'aleksandr-hq'
here = os.path.dirname(os.path.abspath(__file__))
tmp = tempfile.mkdtemp()
BASE_RATE, GAP, TOTAL = 120, 0.35, 150

txt = open(os.path.join(here, 'voice_text.txt'), encoding='utf-8').read()
items = re.findall(r'^\d+\.\s+(\d+):(\d+)[–-](\d+):(\d+).*\n(.+)$', txt, re.M)

def dur(f):
    return float(subprocess.check_output(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))

def synth(text, rate, f):
    raw = f + '.raw.wav'
    subprocess.run(['RHVoice-test', '-p', voice, '-r', str(rate), '-q', 'max', '-R', '24000', '-o', raw],
                   input=text.encode(), check=True)
    trim = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,' \
           'silenceremove=start_periods=1:start_threshold=-50dB,areverse'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', trim, f], check=True)
    os.remove(raw)
    return dur(f)

files, starts, durs = [], [], []
for i, (m1, s1, m2, s2, text) in enumerate(items):
    a, b = int(m1) * 60 + int(s1), int(m2) * 60 + int(s2)
    last = i == len(items) - 1
    # последняя реплика не помещается в свои 2 с — занимает хвост предыдущего отрезка
    slot = (b - a - GAP) if not last else (TOTAL - (starts[-1] + durs[-1]) - GAP)
    rate = BASE_RATE if not last else 135
    f = os.path.join(tmp, f'{i + 1:02d}.wav')
    d = synth(text, rate, f)
    while d > slot and rate < 200:           # ускоряем только те реплики, что не влезли
        rate = min(200, int(rate * d / slot) + 2)
        d = synth(text, rate, f)
    start = a + 0.1 if not last else min(a, TOTAL - d - 0.05)
    files.append(f); starts.append(start); durs.append(d)
    print(f'{i + 1:2d}  {start:7.2f}–{start + d:7.2f}  темп {rate}%')

cmd = ['ffmpeg', '-v', 'error', '-y', '-i', video]
fc = ''
for i, (f, s) in enumerate(zip(files, starts)):
    cmd += ['-i', f]
    fc += f'[{i + 1}:a]adelay={int(s * 1000)}:all=1[a{i}];'
fc += ''.join(f'[a{i}]' for i in range(len(files)))
fc += (f'amix=inputs={len(files)}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,'
       f'aresample=48000,apad=whole_dur={TOTAL},atrim=0:{TOTAL}[a]')
cmd += ['-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '160k', '-ac', '2', '-movflags', '+faststart', result]
subprocess.run(cmd, check=True)
