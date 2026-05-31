#!/usr/bin/env python3
"""Crop 01-6 / 01-7 vocabulary pictures from user-provided textbook screenshots."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path("/Users/imacpro/.cursor/projects/Users-imacpro-Website-HSK/assets")
OUT_06 = ROOT / "public" / "media" / "img" / "l1-01-6"
OUT_07 = ROOT / "public" / "media" / "img" / "l1-01-7"

IMG_06 = ASSETS / "Screenshot_2026-05-30_at_9.27.52_PM-d0b29396-bf7a-4c8b-82b7-141a8b59b298.png"
IMG_07 = ASSETS / "Screenshot_2026-05-30_at_9.28.52_PM-5fe30e32-b01c-4f46-aba7-27de3d5d6e10.png"

# 01-6: 3×4 grid (left→right, top→bottom) — matches legacy play() order
IDS_06 = [
    "yi1", "wu3", "yu2", "er3",
    "bi3", "mao1", "dao3", "hua1",
    "ji1", "qi1", "xie2", "xue3",
]

# 01-7: 2×4 grid
IDS_07 = [
    "ka1fei1", "ke3le4", "kao3ya1", "huo3guo1",
    "di4tu2", "fei1ji1", "mao2bi3", "er2ji1",
]

# Crop boxes tuned for 1024px-wide screenshots (monosyllabic / disyllabic pages).
BOX_06 = dict(left=34, top=142, cols=4, rows=3, cell_w=241, cell_h=204, gap_x=2, gap_y=2)
BOX_07 = dict(left=34, top=112, cols=4, rows=2, cell_w=241, cell_h=222, gap_x=2, gap_y=2)


def crop_grid(img: Image.Image, spec: dict, ids: list[str], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for i, name in enumerate(ids):
        row, col = divmod(i, spec["cols"])
        x = spec["left"] + col * (spec["cell_w"] + spec["gap_x"])
        y = spec["top"] + row * (spec["cell_h"] + spec["gap_y"])
        box = (x, y, x + spec["cell_w"], y + spec["cell_h"])
        cell = img.crop(box)
        cell.save(out_dir / f"{name}.png", optimize=True)
        print(f"  {out_dir.name}/{name}.png  {cell.size}")


def main() -> None:
    print("Cropping 01-6 …")
    crop_grid(Image.open(IMG_06), BOX_06, IDS_06, OUT_06)
    print("Cropping 01-7 …")
    crop_grid(Image.open(IMG_07), BOX_07, IDS_07, OUT_07)
    print("Done.")


if __name__ == "__main__":
    main()
