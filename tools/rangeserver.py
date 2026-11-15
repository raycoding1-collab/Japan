# A static server that honours Range requests, like real hosting (GitHub Pages) does, so seeking works as it will live.
# usage: python3 tools/rangeserver.py . &   -> http://localhost:8766/
import os, re, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
class H(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        rng = self.headers.get('Range'); path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path): return super().send_head()
        m = re.match(r'bytes=(\d*)-(\d*)', rng); size = os.path.getsize(path)
        start = int(m.group(1)) if m.group(1) else 0; end = int(m.group(2)) if m.group(2) else size - 1
        end = min(end, size - 1); f = open(path, 'rb'); f.seek(start); self._left = end - start + 1
        self.send_response(206); self.send_header('Content-Type', self.guess_type(path)); self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}'); self.send_header('Content-Length', str(self._left)); self.end_headers()
        return f
    def copyfile(self, src, dst):
        left = getattr(self, '_left', None)
        if left is None: return super().copyfile(src, dst)
        while left > 0:
            b = src.read(min(65536, left))
            if not b: break
            dst.write(b); left -= len(b)
        self._left = None
os.chdir(sys.argv[1] if len(sys.argv) > 1 else '.'); ThreadingHTTPServer(('127.0.0.1', int(sys.argv[2]) if len(sys.argv) > 2 else 8766), H).serve_forever()
