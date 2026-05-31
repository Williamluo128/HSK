#!/usr/bin/env python3
"""Crop 02-5 / 02-6 vocabulary pictures from user-provided textbook screenshots."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path("/Users/imacpro/.cursor/projects/Users-imacpro-Website-HSK/assets")
OUT_25 = ROOT / "public" / "media" / "img" / "l1-02-5"
OUT_26 = ROOT / "public" / "media" / "img" / "l1-02-6"

IMG_25 = ASSETS / "Screenshot_2026-05-30_at_10.01.42_PM-ff7404bb-575a-4610-bbff-cf367c20c351.png"
IMG_26 = ASSETS / "Screenshot_2026-05-30_at_10.02.22_PM-2f30bc74-b557-48d4-a30c-e82af6fd9271.png"

# 02-5: 4×4 grid (left→right, top→bottom) — matches legacy play() order
IDS_25 = [
    "san1", "shan1", "zhong1", "yang2",
    "ling2", "cai4", "shou3", "xiong2",
    "yun2", "xing1", "yuan2", "ren2",
    "chuan2", "chuang2", "chi1", "re4",
]

# 02-6: 2×4 grid
IDS_26 = [
    "bing1xiang1", "ji1dan4", "si1ji1", "zu2qiu2",
    "ji1chang3", "pa2shan1", "shou3biao3", "xiong2mao1",
]

# Tuned for 1024px-wide user screenshots (图在上、拼音在下；top 须落在第一行图片框上缘).
BOX_25 = dict(left=34, top=90, cols=4, rows=4, cell_w=241, cell_h=218, gap_x=2, gap_y=2)
BOX_26 = dict(left=34, top=88, cols=4, rows=2, cell_w=241, cell_h=232, gap_x=2, gap_y=2)


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
    print("Cropping 02-5 …")
    crop_grid(Image.open(IMG_25), BOX_25, IDS_25, OUT_25)
    print("Cropping 02-6 …")
    crop_grid(Image.open(IMG_26), BOX_26, IDS_26, OUT_26)
    print("Done.")


if __name__ == "__main__":
    main()
