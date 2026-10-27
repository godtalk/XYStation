"""Build 480px JPEG thumbs so the wall never fetches 1–2MB originals."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "images"
OUT = SRC / "thumbs"
MAX_EDGE = 480


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    count = 0
    for path in SRC.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue
        if "thumbs" in path.parts:
            continue
        rel = path.relative_to(SRC)
        dest = (OUT / rel).with_suffix(".jpg")
        dest.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(path) as im:
            rgb = im.convert("RGB")
            rgb.thumbnail((MAX_EDGE, MAX_EDGE))
            rgb.save(dest, "JPEG", quality=78, optimize=True)
        count += 1
        print(f"{dest.relative_to(ROOT)}  {dest.stat().st_size // 1024}KB")
    print(f"thumbs: {count}")


if __name__ == "__main__":
    main()
