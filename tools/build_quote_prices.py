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
  - SPECIAL tab (this month's specials): COST and 24PC cost, no mix & match.
  - BLOWOUT tab: closeouts with quantity on hand.
  - A text-only row on an item code (e.g. "$34.00 WHEN SOLD WITH SAW DEALS") is kept as a note.
Never reads or writes customer data.
"""
import json, math, re, sys, datetime
import openpyxl

MS = [3, 2.2, 2.1, 2, 1.9, 1.8, 1.7, 1.6, 1.5, 1.3]
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
    vals = [v for v in rest if v is not None]
    for m in MS:
        if any(abs(v - (cost * m + 0.49)) < 0.011 for v in vals):
            return 'add49'
    for m in MS:
        if any(abs(v - math.ceil(cost * m - 1e-9)) < 0.011 for v in vals):
            return 'ceil'
    return 'add49'


def build(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    items, notes, specials, blowout = {}, {}, {}, {}
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
            for r in rows:
                if r and s(r[0]) and num(r[2] if len(r) > 2 else None) and num(r[3] if len(r) > 3 else None):
                    specials[norm(s(r[0]))] = {'code': s(r[0]), 'desc': s(r[1]), 'cost': num(r[2]), 'cost24': num(r[3])}
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
                while k in items and items[k]['desc'] != desc:
                    k, n = f'{key}#{n}', n + 1
                items[k] = {'code': code, 'desc': desc, 'cost': round(cost, 2), 'mode': mode_for(cost, rest), 'tab': title}
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
                    'special': {'cost': sp['cost'], 'cost24': sp['cost24']}}
    for k, b in blowout.items():
        items[k] = {'code': b['code'], 'desc': b['desc'], 'cost': b['cost'], 'mode': 'add49', 'tab': 'BLOWOUT', 'blowout': b['qty']}
    for k, n in notes.items():
        if k in items:
            items[k]['note'] = n
    return {'name': re.sub(r'\.xlsx$', '', path.split('/')[-1], flags=re.I), 'date': list_date,
            'built': datetime.date.today().isoformat(), 'count': len(items), 'items': items}


if __name__ == '__main__':
    out = build(sys.argv[1])
    dst = sys.argv[2] if len(sys.argv) > 2 else 'quote-prices.json'
    with open(dst, 'w') as f:
        json.dump(out, f, separators=(',', ':'), sort_keys=True)
    sp = sum(1 for v in out['items'].values() if 'special' in v)
    bo = sum(1 for v in out['items'].values() if 'blowout' in v)
    print(f"{dst}: {out['count']} items ({sp} specials, {bo} blowout), list date {out['date']}")
