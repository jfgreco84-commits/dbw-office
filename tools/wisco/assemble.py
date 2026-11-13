#!/usr/bin/env python3
"""Assemble wisco/index.html from page_body.html.  Optional: --preview OUT.html writes a
body-only copy with CSS/JS inlined (used for the private Claude preview page)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(os.path.dirname(os.path.dirname(HERE)), "wisco")
TITLE = "DBW WISCO Blade Shop"
# Where the store is served. Text-message link previews need a full address for the picture.
# Change this if the store moves to its own domain.
SITE_URL = "https://jfgreco84-commits.github.io/dbw-office/wisco/"
DESC = "Reorder diamond blades, core bits and chain from DBW WISCO, a division of Diamond Blade Warehouse. Shipping nationwide. Pick your material, pick your saw, send the order to your rep."
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Montserrat:wght@500;600;700;800;900&display=swap">'
body = open(os.path.join(HERE, "page_body.html"), encoding="utf8").read()
ver = str(int(max(os.path.getmtime(os.path.join(SITE, f)) for f in ("app.js", "app.css", "catalog.js", "config.js"))))

full = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta property="og:title" content="DBW WISCO: the right blade, right now">
<meta property="og:description" content="{DESC}">
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE_URL}">
<meta property="og:image" content="{SITE_URL}brand/share.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="brand/icon-192.png">
<link rel="apple-touch-icon" href="brand/icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-title" content="DBW WISCO">
<meta name="theme-color" content="#071433">
{FONTS}
<link rel="stylesheet" href="app.css?v={ver}">
</head>
<body>
{body}
<script src="config.js?v={ver}"></script>
<script src="catalog.js?v={ver}"></script>
<script src="app.js?v={ver}"></script>
</body>
</html>
"""
open(os.path.join(SITE, "index.html"), "w", encoding="utf8").write(full)
print("wrote wisco/index.html")

if "--preview" in sys.argv:
    out = sys.argv[sys.argv.index("--preview") + 1]
    css = open(os.path.join(SITE, "app.css"), encoding="utf8").read()
    js = open(os.path.join(SITE, "app.js"), encoding="utf8").read()
    page = f"""<title>{TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
{FONTS}
<style>
{css}
</style>
{body}
<script src="config.js"></script>
<script src="catalog.js"></script>
<script>
{js}
</script>
"""
    open(out, "w", encoding="utf8").write(page)
    print("wrote preview", out)
