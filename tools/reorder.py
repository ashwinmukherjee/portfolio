#!/usr/bin/env python3
"""Drag-to-reorder tool for the film gallery.

  python3 tools/reorder.py

0. Any .tif scan in img/film/ is converted to a .jpg beside it, cropped/scaled to the standard 3089x2048 (q99, sRGB).
   The .tif stays put (gitignored) so you keep the original.
1. Any scan in img/film/ without a display copy gets one (2048px long edge, q80) in img/web/film/.
2. Any scan git doesn't track yet is appended to content/photos.json with a caption drafted from its filename.
   (Committed scans missing from the JSON are treated as deliberately removed and left alone.)
3. A local UI opens at http://localhost:8765 — drag to reorder, edit captions, Save writes photos.json.

Scans that git doesn't track yet are flagged "new" in the UI.
"""
import json, os, re, subprocess, sys, webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCANS = os.path.join(ROOT, 'img', 'film')
WEB = os.path.join(ROOT, 'img', 'web', 'film')
PHOTOS = os.path.join(ROOT, 'content', 'photos.json')
PORT = 8765
SCAN_SIZE = '3089x2048'  # every existing scan in img/film/ is this size
SKIP = {'cascadecanyon', 'mormonrow', 'phelpslake'}  # TIFs left out of the gallery on purpose


def load():
    with open(PHOTOS) as f:
        return json.load(f)


def save(photos):
    with open(PHOTOS, 'w') as f:
        json.dump(photos, f, indent=2)
        f.write('\n')


def title_from(filename):
    return re.sub(r'[_\-]+', ' ', os.path.splitext(filename)[0]).title()


def convert_tifs():
    for f in sorted(os.listdir(SCANS)):
        name, ext = os.path.splitext(f)
        if ext.lower() not in ('.tif', '.tiff') or name in SKIP:
            continue
        src = os.path.join(SCANS, f)
        out = os.path.join(SCANS, name + '.jpg')
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
            continue
        print('converting', f)
        # flip the target for portrait scans, then fill + center-crop to the exact size
        w, h = map(int, subprocess.run(['magick', 'identify', '-format', '%w %h', src + '[0]'],
                                       check=True, capture_output=True, text=True).stdout.split())
        size = SCAN_SIZE if w >= h else 'x'.join(reversed(SCAN_SIZE.split('x')))
        subprocess.run(['magick', src + '[0]', '-colorspace', 'sRGB', '-resize', size + '^', '-gravity', 'center',
                        '-extent', size, '-quality', '99', '-sampling-factor', '4:4:4', out],
                       check=True, capture_output=True)


def sync():
    os.makedirs(WEB, exist_ok=True)
    convert_tifs()
    photos = load()
    known = {os.path.basename(p['src']) for p in photos}
    fresh = untracked()
    scans = sorted(f for f in os.listdir(SCANS) if f.lower().endswith(('.jpg', '.jpeg', '.png')))
    for f in scans:
        out = os.path.join(WEB, f)
        src = os.path.join(SCANS, f)
        if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src):
            print('resizing', f)
            subprocess.run(['sips', '-Z', '2048', '--setProperty', 'formatOptions', '80', src, '--out', out],
                           check=True, capture_output=True)
        if f not in known and f in fresh:
            print('adding', f)
            photos.append({'src': 'img/web/film/' + f, 'alt': '', 'caption': title_from(f), 'film': None, 'year': None})
    save(photos)


def untracked():
    r = subprocess.run(['git', 'ls-files', '--others', '--exclude-standard', 'img/film'],
                       cwd=ROOT, capture_output=True, text=True)
    return {os.path.basename(l) for l in r.stdout.splitlines() if l}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/':
            self.path = '/tools/reorder.html'
        elif self.path == '/api/photos':
            return self.send_json({'photos': load(), 'new': sorted(untracked())})
        return super().do_GET()

    def do_POST(self):
        if self.path != '/api/save':
            return self.send_json({'error': 'not found'}, 404)
        n = int(self.headers.get('Content-Length', 0))
        photos = json.loads(self.rfile.read(n))
        save(photos)
        print('saved', len(photos), 'photos')
        self.send_json({'ok': True, 'count': len(photos)})


if __name__ == '__main__':
    sync()
    url = f'http://localhost:{PORT}/'
    print(f'reorder UI at {url}  (ctrl-c to stop)')
    if '--no-open' not in sys.argv:
        webbrowser.open(url)
    try:
        HTTPServer(('localhost', PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        pass
