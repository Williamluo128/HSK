#!/usr/bin/env python3
"""Crop warmup / text illustrations from HSK SC1 PDF (see pdf-l1-lesson-images.json)."""
from __future__ import annotations

import io
import json
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "data" / "HSK-standard-course-1.pdf"
CONFIG_PATH = ROOT / "scripts" / "pdf-l1-lesson-images.json"
PAGES = ROOT / "data" / "pdf-pages" / "full"
OUT = ROOT / "public" / "media" / "img"


def crop_box(im: Image.Image, box_frac: list[float], img_ratio: float = 1.0) -> Image.Image:
    w, h = im.size
    x0, y0, x1, y1 = [int(w * box_frac[0]), int(h * box_frac[1]), int(w * box_frac[2]), int(h * box_frac[3])]
    if img_ratio < 1.0:
        y1 = y0 + int((y1 - y0) * img_ratio)
    return im.crop((x0, y0, x1, y1))


def render_page(page_index: int, target_w: int) -> Image.Image:
    doc = fitz.open(PDF)
    page = doc[page_index]
    scale = target_w / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale))
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    doc.close()
    return img


def crop_warmup_boxes(page: int, spec: dict, out_dir: Path) -> None:
    """Crop 3×2 warm-up photos (lessons 3–10) using tuned boxes on a 1024px render."""
    target_w = spec.get("renderWidth", 1024)
    img = render_page(page - 1, target_w)
    out_dir.mkdir(parents=True, exist_ok=True)
    for label in spec["labels"]:
        x0, y0, x1, y1 = spec["boxes1024"][label]
        cell = img.crop((x0, y0, x1, y1))
        cell.save(out_dir / f"{label}.png", optimize=True)
        print(f"  {out_dir.name}/{label}.png {cell.size}")


def crop_grid(page: int, spec: dict, labels: list[str], out_dir: Path) -> None:
    path = PAGES / f"page-{page:03d}.png"
    im = Image.open(path)
    w, h = im.size
    cols, rows = spec["cols"], spec["rows"]
    x0, x1 = int(w * spec["x0"]), int(w * spec["x1"])
    y0, y1 = int(h * spec["y0"]), int(h * spec["y1"])
    margin = spec.get("margin", 8)
    ratio = spec.get("imageHeightRatio", 0.78)
    rw, rh = x1 - x0, y1 - y0
    cw, ch = rw // cols, rh // rows
    out_dir.mkdir(parents=True, exist_ok=True)
    for i, label in enumerate(labels):
        row, col = divmod(i, cols)
        cx0 = x0 + col * cw + margin
        cy0 = y0 + row * ch + margin
        cx1 = x0 + (col + 1) * cw - margin
        cy1 = y0 + (row + 1) * ch - margin
        cell_h = cy1 - cy0
        cell = im.crop((cx0, cy0, cx1, cy0 + int(cell_h * ratio)))
        cell.save(out_dir / f"{label}.png", optimize=True)
        print(f"  {out_dir.name}/{label}.png {cell.size}")


def resolve_lesson_plan(cfg: dict, lesson: int) -> dict:
    key = str(lesson)
    if key in cfg.get("lessons", {}):
        return cfg["lessons"][key]
    offset = cfg["textbookToPdfOffset"]
    starts = cfg["lessonStarts"]
    start_pdf = starts[lesson - 1] + offset
    plan: dict = {"warmup": {"page": start_pdf}, "texts": []}
    if lesson >= 3:
        plan["warmup"] = {"page": start_pdf}
    defs = cfg["defaultTextBoxes"]
    plan["texts"].append({"n": 1, "page": start_pdf, "box": defs["onStartPage"]["box"]})
    for t in defs["onNextPage"]:
        plan["texts"].append({"n": t["n"], "page": start_pdf + 1, "box": t["box"]})
    if lesson == 2:
        plan.pop("warmup", None)
        plan["texts"] = cfg["lessons"]["2"]["texts"]
    return plan


def main() -> None:
    cfg = json.loads(CONFIG_PATH.read_text())
    warmup_spec = cfg["warmupGrid"]
    labels = warmup_spec["labels"]

    for lesson in range(1, 16):
        plan = resolve_lesson_plan(cfg, lesson)
        base = OUT / f"l1-{lesson:02d}"

        if plan.get("warmup") and 3 <= lesson <= 10:
            page = plan["warmup"]["page"]
            print(f"L{lesson} warmup page {page}")
            if warmup_spec.get("boxes1024"):
                crop_warmup_boxes(page, warmup_spec, base / "warmup")
            else:
                crop_grid(page, warmup_spec, labels, base / "warmup")

        for t in plan.get("texts", []):
            n = t["n"]
            page = t["page"]
            out = base / f"text-{n}.png"
            out.parent.mkdir(parents=True, exist_ok=True)
            im = Image.open(PAGES / f"page-{page:03d}.png")
            cell = crop_box(im, t["box"])
            cell.save(out, optimize=True)
            print(f"  L{lesson} text-{n} page {page} -> {out.relative_to(ROOT)} {cell.size}")

    print("Done.")


if __name__ == "__main__":
    main()
