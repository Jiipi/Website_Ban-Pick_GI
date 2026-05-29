from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python make_contact_sheet.py IMAGE_DIR OUT_PNG")
        return 2
    image_dir = Path(sys.argv[1])
    out = Path(sys.argv[2])
    images = sorted(
        [p for p in image_dir.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg"}],
        key=lambda p: p.name,
    )
    thumb_w, thumb_h = 320, 190
    pad = 18
    label_h = 28
    cols = 3
    rows = (len(images) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (thumb_w + pad) + pad, rows * (thumb_h + label_h + pad) + pad), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 14)
    except Exception:
        font = ImageFont.load_default()

    for idx, path in enumerate(images):
        img = Image.open(path).convert("RGB")
        img.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        x = pad + (idx % cols) * (thumb_w + pad)
        y = pad + (idx // cols) * (thumb_h + label_h + pad)
        frame = Image.new("RGB", (thumb_w, thumb_h), "#f7f7f7")
        ox = (thumb_w - img.width) // 2
        oy = (thumb_h - img.height) // 2
        frame.paste(img, (ox, oy))
        sheet.paste(frame, (x, y))
        draw.rectangle((x, y, x + thumb_w, y + thumb_h), outline="#999999")
        draw.text((x, y + thumb_h + 6), f"{path.name}  {Image.open(path).size}", fill="black", font=font)

    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
