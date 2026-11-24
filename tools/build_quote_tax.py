#!/usr/bin/env python3
"""Build quote-tax.json (the quote tool's tax finder data).

    python3 tools/build_quote_tax.py pcs-taxrates.html US.txt

pcs-taxrates.html : the Wisconsin DOR "Tax Rates" page
                    https://www.revenue.wi.gov/Pages/FAQS/pcs-taxrates.aspx (its Sales Tax Rate Chart)
US.txt            : GeoNames US postal codes (CC BY 4.0, https://www.geonames.org), tab separated:
                    country, zip, city, state name, state code, county, ...

Output: state rate, every Wisconsin county's county tax rate (0 where none), the City of
Milwaukee tax, the DOR guidance date, and ZIP -> [city, state, county] for every US ZIP.
Fails loudly if the chart does not list all 72 Wisconsin counties, so a changed page can't
silently ship wrong rates.
"""
import html, json, re, sys

src_html, src_zip = sys.argv[1], sys.argv[2]
raw = open(src_html, encoding='utf-8', errors='ignore').read()
t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', raw, flags=re.S)
t = re.sub(r'<(br|/p|/li|/tr|/h\d|/td)[^>]*>', '\n', t)
t = html.unescape(re.sub(r'<[^>]+>', ' ', t))
t = re.sub(r'[ \t\xa0]+', ' ', t)

state = re.search(r'Wisconsin sales tax is a (\d+(?:\.\d+)?)% tax', t)
state = float(state.group(1)) if state else None

# Read the Sales Tax Rate Chart table cell by cell: county, code, state rate, county rate (eff.), city rate (eff.)
start = raw.find('<table', raw.find('Sales Tax Rate Chart', raw.find('Sales Tax Rate Chart') + 30))
table = raw[start:raw.find('</table>', start)]
cell = lambda c: html.unescape(re.sub(r'<[^>]+>', ' ', c)).split()
counties, city = {}, None
for row in re.findall(r'<tr[^>]*>(.*?)</tr>', table, re.S):
    c = [cell(x) for x in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.S)]
    if len(c) < 5 or not c[0]:
        continue
    name = ' '.join(c[0])
    if name.upper().startswith('COUNTY'):
        continue
    if name.startswith('(City of Milwaukee)'):
        if c[4]:
            city = (float(c[4][0].rstrip('%')), c[4][1].strip('()') if len(c[4]) > 1 else '')
        continue
    rate = float(c[3][0].rstrip('%')) if c[3] else 0.0   # first rate listed is the current one
    since = c[3][1].strip('()') if len(c[3]) > 1 else ''
    counties[name] = {'rate': rate, 'since': since}
asof = re.search(r'Guidance Document Number: \d+\s*\n?\s*([A-Z][a-z]+ \d{1,2}, \d{4})', t)

if state != 5.0 or len(counties) != 72 or not city:
    sys.exit(f'Chart did not parse cleanly: state={state} counties={len(counties)} city={bool(city)}. Check the page.')

zips = {}
for line in open(src_zip, encoding='utf-8'):
    f = line.rstrip('\n').split('\t')
    if len(f) > 5 and f[0] == 'US' and re.fullmatch(r'\d{5}', f[1]):
        zips[f[1]] = [f[2], f[4], f[5]]

out = {
    'source': 'Wisconsin Department of Revenue, Tax Rates (Sales Tax Rate Chart), https://www.revenue.wi.gov/Pages/FAQS/pcs-taxrates.aspx',
    'lookup': 'https://www.revenue.wi.gov/Pages/Apps/strb.aspx',
    'asOf': asof.group(1) if asof else '',
    'zipSource': 'GeoNames postal codes, CC BY 4.0 (geonames.org)',
    'wi': {'state': state, 'counties': counties, 'milwaukeeCity': city[0], 'milwaukeeCitySince': city[1]},
    'zips': zips,
}
with open('quote-tax.json', 'w') as fh:
    json.dump(out, fh, separators=(',', ':'), sort_keys=True)
none = [k for k, v in counties.items() if not v['rate']]
print(f"quote-tax.json: WI {state}% state, 72 counties (no county tax: {', '.join(none)}), "
      f"Milwaukee County {counties['Milwaukee']['rate']}%, City of Milwaukee {city[0]}%, {len(zips)} US ZIPs, as of {out['asOf']}")
