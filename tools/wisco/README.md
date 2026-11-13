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

**Pricing rules** (set by the owner, all in `build.py`):

- Buy It Now = standard cost x 2.5 on everything that has a cost on the price list.
- "1 item at our cost", stock-up pricing and quantity price breaks are offers only. The rep gives the number.
- Saw deal builder: counts blades toward the 15 / 25 / 36 tiers and sends the build to the rep, who prices it.
  Building with `--sawdeal-totals` makes it show the package total on the page
  ((saw cost + blade costs) x 2.0 / 1.8 / 1.7). That puts a cost-based figure for each saw and blade into
  `catalog.js`, which is public, so it is off by default.
- `--master` adds 4-Core Pro Series core bits and Zenesis Green Kut from the master price book.

No price list or price book is ever committed. Both hold cost.

**No card or bank numbers.** Checkout only records how the customer wants to pay (terms, card on file,
call me, ACH, check by phone). Do not add card-number fields to this site.

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

## If the store moves

`SITE_URL` at the top of `assemble.py` is the full web address of the store. The picture that shows
up when the link is texted (`wisco/brand/share.jpg`) needs it. Change it and run `assemble.py` again
if the store moves to its own domain.
