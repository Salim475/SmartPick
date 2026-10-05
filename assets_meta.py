from pathlib import Path
import json, subprocess
from PIL import Image
root = Path(r'c:\Users\SALIM\Downloads\smartpick (1)\assets')
for p in sorted(root.iterdir(), key=lambda p: p.name.lower()):
    s = p.stat().st_size
    ext = p.suffix.lower()
    if ext in {'.jpg', '.jpeg', '.png', '.jfif', '.webp'}:
        try:
            with Image.open(p) as img:
                w, h = img.size
            print(f'{p.name}\tIMAGE\t{s}\t{w}x{h}')
        except Exception as e:
            print(f'{p.name}\tIMAGE\t{s}\tERR:{e}')
    elif ext in {'.mp4', '.mov', '.webm'}:
        try:
            cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,duration', '-of', 'json', str(p)]
            out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL)
            js = json.loads(out)
            st = js.get('streams', [{}])[0]
            w = st.get('width'); h = st.get('height'); d = st.get('duration')
            print(f'{p.name}\tVIDEO\t{s}\t{w}x{h}\t{d}')
        except Exception as e:
            print(f'{p.name}\tVIDEO\t{s}\tERR:{e}')
    else:
        print(f'{p.name}\t{ext}\t{s}')
