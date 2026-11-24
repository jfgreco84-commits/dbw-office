#!/usr/bin/env python3
"""Build quote-tax.json (the quote tool's tax finder data).

    python3 tools/build_quote_tax.py pcs-taxrates.html US.txt [TAXRATES_ZIP5_XX*.csv ...]

pcs-taxrates.html : the Wisconsin DOR "Tax Rates" page
                    https://www.revenue.wi.gov/Pages/FAQS/pcs-taxrates.aspx (its Sales Tax Rate Chart)
US.txt            : GeoNames US postal codes (CC BY 4.0, https://www.geonames.org), tab separated:
                    country, zip, city, state name, state code, county, ...

TAXRATES_ZIP5_*.csv (optional, any number): Avalara's free monthly ZIP rate tables, one per state,
                    columns State, ZipCode, TaxRegionName, EstimatedCombinedRate, ... (rates as decimals).
                    Used for every state except Wisconsin, which always comes from the DOR chart.

Output: state rate, every Wisconsin county's county tax rate (0 where none), the City of
Milwaukee tax, the DOR guidance date, and ZIP -> [city, state, county] for every US ZIP.
Fails loudly if the chart does not list all 72 Wisconsin counties, so a changed page can't
silently ship wrong rates.
"""
import html, json, re, sys

import csv, os
src_html, src_zip, src_avalara = sys.argv[1], sys.argv[2], sys.argv[3:]
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
    'zipRates': {}, 'zipRatesFrom': [],
    # Where DBW collects sales tax: 'ALL' (Justin, Nov 23 2026: every state unless the buyer is exempt),
    # a list of state codes, or None (unknown: out-of-state tax shows "if applicable").
    # Carried over from the existing quote-tax.json on every rebuild.
    'collectStates': 'ALL',
}
if os.path.exists('quote-tax.json'):
    try:
        old = json.load(open('quote-tax.json'))
        if 'collectStates' in old:
            out['collectStates'] = old['collectStates']
        if not src_avalara:   # no new Avalara files this run: keep last month's out-of-state rates
            out['zipRates'], out['zipRatesFrom'] = old.get('zipRates', {}), old.get('zipRatesFrom', [])
    except ValueError:
        pass
for path in src_avalara:
    n0 = len(out['zipRates'])
    with open(path, newline='', encoding='utf-8-sig') as fh:
        for row in csv.DictReader(fh):
            st, z, r = (row.get('State') or '').strip().upper(), (row.get('ZipCode') or '').strip().zfill(5), row.get('EstimatedCombinedRate')
            if st and st != 'WI' and re.fullmatch(r'\d{5}', z) and r not in (None, ''):
                out['zipRates'][z] = round(float(r) * 100, 4)
    if len(out['zipRates']) == n0:
        sys.exit(f'{path}: no rates read. Is this an Avalara TAXRATES_ZIP5 file?')
    out['zipRatesFrom'].append(os.path.basename(path))
with open('quote-tax.json', 'w') as fh:
    json.dump(out, fh, separators=(',', ':'), sort_keys=True)
none = [k for k, v in counties.items() if not v['rate']]
print(f"quote-tax.json: WI {state}% state, 72 counties (no county tax: {', '.join(none)}), "
      f"Milwaukee County {counties['Milwaukee']['rate']}%, City of Milwaukee {city[0]}%, {len(zips)} US ZIPs, as of {out['asOf']}; "
      f"{len(out['zipRates'])} out-of-state ZIP rates from {len(out['zipRatesFrom'])} Avalara file(s)")
