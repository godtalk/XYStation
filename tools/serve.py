"""Local static server with HTTP Range (206).

Chrome / Edge <video> always asks for byte ranges. `python -m http.server`
ignores Range and replies 200 + whole file, so MP4 metadata never lines up
and the player stays blank even on localhost.
"""
from __future__ import annotations

import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")


class RangeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            file_obj = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        fs = os.fstat(file_obj.fileno())
        size = fs.st_size
        ctype = self.guess_type(path)
        start, end = 0, size - 1
        status = 200
        range_header = self.headers.get("Range")
        if range_header:
            match = RANGE_RE.fullmatch(range_header.strip())
            if not match:
                file_obj.close()
                self.send_error(416, "Invalid Range")
                return None
            left, right = match.group(1), match.group(2)
            if left == "" and right != "":
                suffix = int(right)
                start = max(0, size - suffix)
            else:
                start = int(left) if left else 0
                end = int(right) if right else size - 1
            if start >= size or start > end:
                file_obj.close()
                self.send_error(416, "Requested range not satisfiable")
                return None
            end = min(end, size - 1)
            status = 206

        length = end - start + 1
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(length))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        if status == 206:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        file_obj.seek(start)
        self._range_len = length
        return file_obj

    def copyfile(self, source, outputfile):
        remaining = getattr(self, "_range_len", None)
        if remaining is None:
            super().copyfile(source, outputfile)
            return
        while remaining > 0:
            chunk = source.read(min(65536, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)


def main() -> None:
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), RangeHandler)
    print(f"XYStation  http://127.0.0.1:{PORT}/  (Range 206)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstop")


if __name__ == "__main__":
    main()
