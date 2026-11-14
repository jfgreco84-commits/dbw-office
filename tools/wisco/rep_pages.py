"""Give every rep their own address and their own link thumbnail.

  wisco/<phone-name>/index.html   a tiny page that forwards to the store with that rep attached
  wisco/brand/share/<phone-name>.jpg   the picture a phone shows when the link is texted

Reads the roster from wisco/config.js. Run by assemble.py; safe to run by hand.
"""
import os, re, html
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SITE = os.path.join(ROOT, "wisco")
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
RESERVED = {"brand", "img", "share"}


def roster():
    src = open(os.path.join(SITE, "config.js"), encoding="utf8").read()
    block = src[src.index("reps: ["):]
    out = []
    for m in re.finditer(r'\{\s*name:\s*"([^"]+)",\s*photo:\s*"([^"]*)".*?aka:\s*\[([^\]]*)\]', block):
        aka = re.findall(r'"([^"]+)"', m.group(3))
        if aka and aka[0] not in RESERVED: out.append(dict(name=m.group(1), photo=m.group(2), slug=aka[0]))
    return out


def font(size):
    try: return ImageFont.truetype(BOLD, size)
    except OSError: return ImageFont.load_default()


def share_image(rep, dest):
    base = Image.open(os.path.join(SITE, "brand", "share.jpg")).convert("RGB")
    d = ImageDraw.Draw(base)
    d.rectangle([0, 40, 700, 600], fill=(9, 22, 58))
    y = 70
    pic = os.path.join(SITE, "brand", "reps", rep["photo"]) if rep["photo"] else ""
    if pic and os.path.exists(pic):
        av = Image.open(pic).convert("RGB").resize((230, 230), Image.LANCZOS)
        mask = Image.new("L", (230, 230), 0); ImageDraw.Draw(mask).ellipse([0, 0, 229, 229], fill=255)
        d.ellipse([56, y - 4, 56 + 237, y + 233], fill=(255, 255, 255))
        base.paste(av, (60, y), mask)
    else:
        ini = "".join(w[0] for w in rep["name"].split()[:2]).upper()
        d.ellipse([56, y - 4, 56 + 237, y + 233], fill=(255, 255, 255)); d.ellipse([60, y, 289, y + 229], fill=(29, 78, 216))
        d.text((175, y + 115), ini, fill="white", font=font(96), anchor="mm")
    name = rep["name"].replace("“", '"').replace("”", '"')
    size = 62
    while size > 30 and d.textlength(name, font=font(size)) > 600: size -= 2
    d.text((60, 330), name, fill="white", font=font(size))
    d.text((60, 410), "YOUR BLADE GUY", fill=(255, 196, 37), font=font(40))
    d.text((60, 480), "Reorder diamond blades in 60 seconds.", fill=(214, 224, 255), font=font(27))
    d.text((60, 530), "DBW WISCO", fill=(255, 255, 255), font=font(27))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    base.save(dest, quality=84)


def build(site_url):
    made = []
    for r in roster():
        share_image(r, os.path.join(SITE, "brand", "share", r["slug"] + ".jpg"))
        name = html.escape(r["name"], quote=True)
        page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name}, your blade guy at DBW WISCO</title>
<meta name="description" content="Reorder diamond blades in 60 seconds. Your order goes straight to {name}.">
<meta property="og:title" content="{name}, your blade guy at DBW WISCO">
<meta property="og:description" content="Reorder diamond blades in 60 seconds. Your order goes straight to {name}.">
<meta property="og:type" content="website">
<meta property="og:url" content="{site_url}{r['slug']}/">
<meta property="og:image" content="{site_url}brand/share/{r['slug']}.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=../?rep={r['slug']}">
<script>location.replace("../?rep={r['slug']}" + location.hash);</script>
</head><body style="font:16px system-ui;background:#071433;color:#fff;padding:24px">
<a style="color:#fff" href="../?rep={r['slug']}">Open DBW WISCO with {name}</a>
</body></html>
"""
        d = os.path.join(SITE, r["slug"]); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf8").write(page)
        made.append(r["slug"])
    return made


if __name__ == "__main__":
    import assemble  # noqa: F401  (assemble calls build())
