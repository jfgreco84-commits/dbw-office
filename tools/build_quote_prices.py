#!/usr/bin/env python3
"""Turn the monthly DBW price list workbook into quote-prices.json for quote.html.

    python3 tools/build_quote_prices.py "FINAL_NOVEMBER_2026_PRICE_LIST.xlsx"

Reads every tab. Rules:
  - A header row (has COST / PRICE, or ITEM / PART / MODEL with DESCRIPTION) sets the
    columns for the rows under it; headers can repeat inside a tab.
  - A row is an item when it has a code and a cost > 0. Other text rows become the
    section title (used in descriptions where the row has no description of its own).
  - Rounding follows the sheet: if the listed markup columns read cost x M + 0.49 the
    item is 'add49'; if they read whole dollars rounded up it is 'ceil'.
  - SPECIAL tab (this month's specials, no mix & match): columns found by their header.
    Every month: COST (1-23) and 24PC (24+). Big months (March, May, August, October):
    COST (regular), 1-11 PC, 12-23 PC and 24PC. A blank 1-11 means the regular COST;
    a blank 12-23 means that blade has no 12-pack break (1-23 at the 1-11 price).
  - BLOWOUT tab: closeouts with quantity on hand.
  - A text-only row on an item code (e.g. "$34.00 WHEN SOLD WITH SAW DEALS") is kept as a note.
Never reads or writes customer data.
"""
import json, math, re, sys, datetime
import openpyxl

MS = [3, 2.2, 2.1, 2, 1.9, 1.8, 1.7, 1.6, 1.5, 1.3]
# Diamond chain fitment: the SAW column on the chain tabs -> the saw name reps pick.
# Unknown SAW values pass through as written, so a new saw on next month's sheet still shows.
SAW_NAMES = {
    '680ES': 'ICS 613 / 680ES (gas)', '613/680': 'ICS 613 / 680ES (gas)',
    '633/695GC': 'ICS 633 / 695GC (gas)', '695XL-F4': 'ICS 695XL Force 4 (gas)',
    'HUSKYK970': 'Husqvarna K970 chain saw (gas)', 'GS461': 'Stihl 461 Rock Boss (gas)', 'STIHLROCKBOSS': 'Stihl 461 Rock Boss (gas)',
    '880F4-890F4': 'ICS 880F4 / 890F4 Force 4 (hydraulic, 12 GPM)', '814PRO': 'ICS 814 Pro (hydraulic, 8 GPM)',
    'ICS823/853': 'ICS 823 / 853 (hydraulic, 8 GPM)', 'RGCMINIC-50': 'RGC Mini C-50 (hydraulic, 8 GPM)',
    'RGC-C150': 'RGC C150 (hydraulic, 8 GPM)', 'RGC-C120': 'RGC C120 Force 4 (hydraulic, 12 GPM)',
    'K6500': 'Husqvarna K6500 high-cycle (hydraulic)',
}


def saw_name(v):
    k = re.sub(r'\s+', '', s(v).upper()).strip('/')
    return SAW_NAMES.get(k, s(v).strip('/ '))
MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
BIG_MONTHS = {'MARCH', 'MAY', 'AUGUST', 'OCTOBER'}   # quote-heavy months: the special adds a 12PC price break
HDR_WORDS = {'COST', 'PRICE', 'DESCRIPTION', 'ITEM #', 'ITEM#', 'PART #', 'PART#', 'MODEL', 'ITEM NUMBER', 'SAWS'}


def s(v):
    return re.sub(r'\s+', ' ', str(v)).strip() if v is not None else ''


def num(v):
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def norm(code):
    return re.sub(r'[\s/]', '', code.upper())


def is_header(row):
    up = [s(c).upper() for c in row]
    return ('COST' in up or 'PRICE' in up) or (('DESCRIPTION' in up) and any(w in up for w in ('ITEM #', 'ITEM#', 'PART #', 'PART#', 'MODEL', 'ITEM NUMBER')))


def colmap(row):
    up = [s(c).upper() for c in row]
    def find(*names):
        for i, u in enumerate(up):
            if u in names:
                return i
        return None
    code = find('ITEM #', 'ITEM#', 'PART #', 'PART#', 'MODEL', 'ITEM NUMBER', 'SAWS')
    desc = find('DESCRIPTION')
    if code is None:
        code = desc if desc is not None else 0
        desc = code + 1 if desc == code else desc
    if desc is None or desc == code:
        desc = code + 1
    cost = find('COST')
    if cost is None:
        cost = find('PRICE')
    return {'code': code, 'desc': desc, 'cost': cost}


def mode_for(cost, rest):
    """Vote: how many of the row's printed prices match cost x M + 0.49 vs cost x M rounded up
    to the dollar (M = any markup on the sheet). Majority wins; ties keep +$0.49."""
    vals = [v for v in rest if v is not None]
    add = sum(1 for v in vals if any(abs(v - (cost * m + 0.49)) < 0.011 for m in MS))
    up = sum(1 for v in vals if any(abs(v - math.ceil(cost * m - 1e-9)) < 0.011 for m in MS))
    return 'ceil' if up > add else 'add49'


def build(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    items, notes, specials, blowout, fits = {}, {}, {}, {}, {}
    special_mix = None
    list_date = None
    for ws in wb.worksheets:
        title = s(ws.title)
        T = title.upper()
        rows = list(ws.iter_rows(values_only=True))
        for r in rows[:4]:
            for c in r:
                if isinstance(c, datetime.datetime):
                    d = c.date().isoformat()
                    list_date = max(list_date or d, d)
        if T == 'SPECIAL':
            col = {'cost': 2, 'c1': None, 'c12': None, 'c24': 3}   # default layout: code, desc, COST, 24PC
            group = ''
            for r in rows:
                up = [s(c).upper() for c in (r or [])]
                mm = next((u for u in up if 'MIX' in u and 'MATCH' in u), None)
                if mm:   # "NO MIX & MATCH" (each blade counts on its own) or "MIX & MATCH" (blades in a group count together)
                    special_mix = not re.search(r'\bNO\b', mm)
                if 'COST' in up:   # a header row: read where COST / 12PC / 24PC sit
                    ci = up.index('COST')
                    group = s(r[0]) if r and s(r[0]) else group
                    col = {'cost': ci,
                           'c1': next((i for i, u in enumerate(up) if i > ci and re.search(r'(^|\D)1\s*-\s*11(\D|$)', u)), None),
                           'c12': next((i for i, u in enumerate(up) if i > ci and re.search(r'(^|\D)12(\D|$)', u)), None),
                           'c24': next((i for i, u in enumerate(up) if i > ci and re.search(r'(^|\D)24(\D|$)', u)), col['c24'])}
                    continue
                g = lambda i: num(r[i]) if i is not None and i < len(r) else None
                if r and s(r[0]) and g(col['cost']) and g(col['c24']):
                    reg = g(col['cost'])
                    sp = {'code': s(r[0]), 'desc': s(r[1]), 'cost': g(col['c1']) or reg, 'cost24': g(col['c24'])}
                    if g(col['c12']):
                        sp['cost12'] = g(col['c12'])
                    sp['group'] = group
                    if sp['cost'] != reg:
                        sp['reg'] = reg   # big month: the regular cost the 1-11 price came down from
                    specials[norm(s(r[0]))] = sp
            continue
        if T == 'BLOWOUT':
            for r in rows:
                if r and num(r[0]) and s(r[1]) and num(r[3] if len(r) > 3 else None):
                    blowout[norm(s(r[1]))] = {'code': s(r[1]), 'desc': s(r[2]), 'cost': num(r[3]), 'qty': int(num(r[0]))}
            continue
        cm, section = None, ''
        for r in rows:
            if not r or not any(c is not None and s(c) for c in r):
                continue
            if is_header(r):
                cm = colmap(r)
                up = [s(c).upper() for c in r]
                cm['hp'] = up.index('HP') if 'HP' in up else None
                cm['saw'] = (up.index('SAW') if 'SAW' in up else 2) if 'CHAIN' in T else None  # some chain headers label the saw column MSRP
                extra = [s(c) for c in r if isinstance(c, str) and s(c) and s(c).upper() not in HDR_WORDS
                         and s(c).upper() not in ('SAW', 'BRAND', 'MSRP', 'LIST', 'APPLICATION', 'VOLT', 'AMP', 'BIT CAP', 'STAND', 'HP')]
                if T == 'WET BLADES' and extra:
                    section = extra[0]
                continue
            if cm is None:
                txt = [s(c) for c in r if isinstance(c, str) and s(c)]
                if txt and not any(num(c) for c in r):
                    section = txt[0]
                continue
            code = s(r[cm['code']]) if cm['code'] < len(r) else ''
            desc = s(r[cm['desc']]) if cm['desc'] < len(r) else ''
            cost = None
            if cm['cost'] is not None and cm['cost'] < len(r):
                cost = num(r[cm['cost']])
            if cost is None:
                for c in r[cm['desc'] + 1:]:
                    if num(c):
                        cost = num(c)
                        break
            if re.search(r'\b(PART|ITEM)\s*#', code.upper()):   # a header row inside a tab (e.g. VENDOR PART #)
                continue
            if code and cost and cost > 0:
                ci = cm['cost'] if cm['cost'] is not None else next(i for i, c in enumerate(r) if num(c) == cost)
                rest = [num(c) for c in r[ci + 1:]]
                if T == 'WET BLADES':
                    desc = f'{code} {desc} ({section or title})'.strip()
                elif T.startswith('2024 TSURAMI') or 'PUMP' in T:
                    hp = s(r[cm['hp']]) if cm.get('hp') is not None and cm['hp'] < len(r) else ''
                    own = desc if desc and not re.fullmatch(r'[\d./ ]+', desc) else ''
                    desc = f"Tsurumi {code} {own or section}{', ' + hp + ' HP' if hp and not own else ''}".strip()
                elif not desc:
                    desc = section
                key = norm(code)
                k, n = key, 2
                while k in items and (items[k]['desc'] != desc or items[k]['cost'] != round(cost, 2)):
                    k, n = f'{key}#{n}', n + 1
                items[k] = {'code': code, 'desc': desc, 'cost': round(cost, 2), 'mode': mode_for(cost, rest), 'tab': title}
                if cm.get('saw') is not None and cm['saw'] < len(r) and s(r[cm['saw']]) and not num(r[cm['saw']]):
                    lst = fits.setdefault(saw_name(r[cm['saw']]), [])
                    if k not in lst:
                        lst.append(k)
            elif code and not cost:
                note = desc if desc else ''
                if note and norm(code) in items:
                    notes[norm(code)] = note.strip('* ')
                elif not code.upper().startswith('NOTE'):
                    section = ' '.join(x for x in (code, desc) if x).strip()
    for k, sp in specials.items():
        base = items.get(k)
        items[k] = {'code': sp['code'], 'desc': (base or {}).get('desc') or sp['desc'], 'cost': sp['cost'],
                    'mode': (base or {}).get('mode', 'add49'), 'tab': (base or {}).get('tab', 'SPECIAL'),
                    'special': {k: sp[k] for k in ('cost', 'cost12', 'cost24', 'reg', 'group') if k in sp}}
    for k, b in blowout.items():
        items[k] = {'code': b['code'], 'desc': b['desc'], 'cost': b['cost'], 'mode': 'add49', 'tab': 'BLOWOUT', 'blowout': b['qty']}
    for k, n in notes.items():
        if k in items:
            items[k]['note'] = n
    name = re.sub(r'\.xlsx$', '', path.split('/')[-1], flags=re.I)
    name = re.sub(r'^[0-9a-f]{6,}-', '', name)   # drop an upload id prefix (e.g. 80c108cc-FINAL_...)
    month = next((m for m in MONTHS if m in name.upper()), None)
    if not month and list_date:
        month = MONTHS[int(list_date[5:7]) - 1]
    return {'name': name, 'date': list_date, 'month': month.title() if month else '',
            'specialMixMatch': special_mix,
            'bigMonth': bool(month in BIG_MONTHS or any('cost12' in v.get('special', {}) for v in items.values())),
            'built': datetime.date.today().isoformat(), 'count': len(items), 'items': items, 'chainFits': fits}


if __name__ == '__main__':
    out = build(sys.argv[1])
    dst = sys.argv[2] if len(sys.argv) > 2 else 'quote-prices.json'
    with open(dst, 'w') as f:
        json.dump(out, f, separators=(',', ':'), sort_keys=True)
    sp = sum(1 for v in out['items'].values() if 'special' in v)
    bo = sum(1 for v in out['items'].values() if 'blowout' in v)
    s12 = sum(1 for v in out['items'].values() if 'cost12' in v.get('special', {}))
    print(f"{dst}: {out['count']} items ({sp} specials, {s12} with a 12PC price, {bo} blowout), "
          f"{out['month']} list{' (big month)' if out['bigMonth'] else ''}, list date {out['date']}")
