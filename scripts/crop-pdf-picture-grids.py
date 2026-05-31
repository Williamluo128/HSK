#!/usr/bin/env python3
"""Crop picture-word grids from HSK SC1 PDF pages (config: pdf-l1-picture-crops.json)."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "scripts" / "pdf-l1-picture-crops.json"
PAGES = ROOT / "data" / "pdf-pages" / "full"
OUT = ROOT / "public" / "media" / "img"


def crop_section(
    spec: dict,
    ids: list[str],
    out_dir: Path,
) -> None:
    page = spec["page"]
    path = PAGES / f"page-{page:03d}.png"
    if not path.exists():
        raise FileNotFoundError(path)

    im = Image.open(path)
    w, h = im.size
    cols, rows = spec["cols"], spec["rows"]
    x0 = int(w * spec["x0"])
    x1 = int(w * spec["x1"])
    y0 = int(h * spec["y0"])
    y1 = int(h * spec["y1"])
    margin = spec.get("margin", 10)
    img_ratio = spec.get("imageHeightRatio", 0.72)

    rw, rh = x1 - x0, y1 - y0
    cw, ch = rw // cols, rh // rows

    out_dir.mkdir(parents=True, exist_ok=True)
    if len(ids) != cols * rows:
        print(f"  warn: {out_dir.name} expects {cols * rows} ids, got {len(ids)}")

    for i, name in enumerate(ids):
        row, col = divmod(i, cols)
        cx0 = x0 + col * cw + margin
        cy0 = y0 + row * ch + margin
        cx1 = x0 + (col + 1) * cw - margin
        cy1 = y0 + (row + 1) * ch - margin
        cell_h = cy1 - cy0
        img_bottom = cy0 + int(cell_h * img_ratio)
        cell = im.crop((cx0, cy0, cx1, img_bottom))
        cell.save(out_dir / f"{name}.png", optimize=True)
        print(f"  {out_dir.relative_to(ROOT)}/{name}.png  {cell.size}")


def main() -> None:
    config = json.loads(CONFIG.read_text())
    # ids passed via CLI pairs tag:comma-separated
    import sys

    if len(sys.argv) < 2:
        print("Usage: crop-pdf-picture-grids.py TAG:id1,id2,... [TAG2:...]")
        print("  or set ids in scripts/run-l1-picture-crops.py")
        sys.exit(1)

    for arg in sys.argv[1:]:
        tag, ids_str = arg.split(":", 1)
        ids = ids_str.split(",")
        spec = config[tag]
        out_dir = OUT / f"l1-{tag}"
        print(f"Cropping {tag} from page {spec['page']} …")
        crop_section(spec, ids, out_dir)

    print("Done.")


if __name__ == "__main__":
    main()
