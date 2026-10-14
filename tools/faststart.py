"""Move moov before mdat so browsers can play without Range requests."""
from __future__ import annotations

import glob
import os
import struct
import sys

CONTAINERS = {
    b"moov",
    b"trak",
    b"edts",
    b"mdia",
    b"minf",
    b"dinf",
    b"stbl",
    b"mvex",
    b"moof",
    b"traf",
    b"udta",
    b"meta",
}


def read_header(data: bytes, pos: int, end: int):
    if pos + 8 > end:
        return None
    size, typ = struct.unpack(">I4s", data[pos : pos + 8])
    hdr = 8
    if size == 1:
        if pos + 16 > end:
            return None
        size = struct.unpack(">Q", data[pos + 8 : pos + 16])[0]
        hdr = 16
    if size < hdr or pos + size > end:
        return None
    return size, typ, hdr


def patch_offsets(moov: bytearray, delta: int) -> int:
    patched = 0

    def walk(start: int, end: int) -> None:
        nonlocal patched
        pos = start
        while pos < end:
            header = read_header(moov, pos, end)
            if not header:
                break
            size, typ, hdr = header
            payload = pos + hdr
            box_end = pos + size
            if typ in (b"stco", b"co64"):
                if payload + 8 > box_end:
                    pos = box_end
                    continue
                count = struct.unpack(">I", moov[payload + 4 : payload + 8])[0]
                entry = payload + 8
                wide = typ == b"co64"
                step = 8 if wide else 4
                for i in range(count):
                    off = entry + i * step
                    if wide:
                        value = struct.unpack(">Q", moov[off : off + 8])[0] + delta
                        moov[off : off + 8] = struct.pack(">Q", value)
                    else:
                        value = struct.unpack(">I", moov[off : off + 4])[0] + delta
                        moov[off : off + 4] = struct.pack(">I", value)
                    patched += 1
            elif typ in CONTAINERS:
                extra = 4 if typ == b"meta" and payload + 4 <= box_end else 0
                walk(payload + extra, box_end)
            pos = box_end

    walk(0, len(moov))
    return patched


def iter_file_boxes(path: str):
    with open(path, "rb") as fp:
        fp.seek(0, os.SEEK_END)
        total = fp.tell()
        fp.seek(0)
        while fp.tell() < total:
            start = fp.tell()
            hdr = fp.read(8)
            if len(hdr) < 8:
                break
            size, typ = struct.unpack(">I4s", hdr)
            header_len = 8
            if size == 1:
                size = struct.unpack(">Q", fp.read(8))[0]
                header_len = 16
            elif size == 0:
                size = total - start
            yield start, size, typ, header_len
            fp.seek(start + size)


def faststart(src: str) -> bool:
    boxes = list(iter_file_boxes(src))
    ftyp = next((b for b in boxes if b[2] == b"ftyp"), None)
    moov = next((b for b in boxes if b[2] == b"moov"), None)
    mdat = next((b for b in boxes if b[2] == b"mdat"), None)
    if not (ftyp and moov and mdat):
        raise SystemExit(f"missing boxes in {src}")
    if moov[0] < mdat[0]:
        print("already faststart:", src)
        return False

    with open(src, "rb") as fp:
        fp.seek(ftyp[0])
        ftyp_bytes = fp.read(ftyp[1])
        fp.seek(moov[0])
        moov_bytes = bytearray(fp.read(moov[1]))

    new_mdat = len(ftyp_bytes) + len(moov_bytes)
    delta = new_mdat - mdat[0]
    patched = patch_offsets(moov_bytes, delta)
    tmp = src + ".faststart.tmp"
    with open(src, "rb") as inp, open(tmp, "wb") as out:
        out.write(ftyp_bytes)
        out.write(moov_bytes)
        inp.seek(mdat[0])
        left = mdat[1]
        while left:
            chunk = inp.read(min(1024 * 1024, left))
            if not chunk:
                break
            out.write(chunk)
            left -= len(chunk)
    os.replace(tmp, src)
    print(f"faststart {src} delta={delta} stco={patched}")
    return True


def main() -> None:
    paths = sys.argv[1:] or glob.glob(r"D:\XYStation\mp4\*.mp4")
    if not paths:
        raise SystemExit("no mp4 found")
    for path in paths:
        faststart(path)


if __name__ == "__main__":
    main()
