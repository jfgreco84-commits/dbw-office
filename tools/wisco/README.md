# DBW Wisco store (`/wisco/`)

Customer-facing reorder site for the Wisconsin branch. Static files, no server, no card data.

| File | What it is |
|---|---|
| `wisco/index.html`, `app.css`, `app.js` | The store |
| `wisco/config.js` | **Edit this by hand**: order email, phone, text number, rep list, video links |
| `wisco/catalog.js` | Generated. Products, sizes, list prices. Do not hand-edit |
| `wisco/img/` | Product photos (from diamondbladewarehouse.com) |
| `tools/wisco/families.py` | Blade copy, Best/Better/Good grades, star ratings per material |
| `tools/wisco/build.py` | Builds `catalog.js` from the monthly price list |

## New price list each month

```
python3 tools/wisco/build.py "/path/to/FINAL DECEMBER 2026 PRICE LIST.xlsx" --master "/path/to/2026_DBW_MASTER_PRICE_BOOK.xlsx"
python3 tools/wisco/assemble.py
```

Then commit `wisco/`. **Never commit the price list itself. It contains cost.** `build.py` reads cost only
to sanity-check the sheet and writes customer prices only.

Price shown = the price list's own customer column:
blades, bits, grinders = the **3.0** column. Chain and core rigs = the sheet's top column (1.7 / 1.8).
Prestress and wall saw = 2.1. Green Kut = MSRP. Abrasives = LIST. Items with cost only (gas saws, Dustless, skid plates) are left off the site.

`--master` adds two lines the monthly list leaves out, from the master price book: 4-Core Pro Series
core bits (priced 3.0 x cost) and Zenesis Green Kut (the book's 2.2 column). Neither file is ever committed.

## Add a blade video

In `wisco/config.js`, under `videos`, add `"blade-id": "https://www.youtube.com/watch?v=..."`.
The blade id is the end of its link, e.g. `.../wisco/#blade-super-g` -> `super-g`.

## Links a rep can text

- A rep's own link: `.../wisco/?rep=adam-misurek`
- A pre-filled cart: `.../wisco/?cart=AES14SGC1*10,AGT7B7*24` (or use "Copy a reorder link" in the cart)
- Straight to a material: `.../wisco/?m=a` (asphalt). Keys are in `families.py`.

## Refresh product data from the DBW site

`python3 tools/wisco/crawl_dbw_site.py <work_dir>` (needs `<work_dir>/sitemap.xml`), then copy
`dbw_products.json` over `tools/wisco/dbw_site_catalog.json` and rebuild with `--images <cache_dir>`.
