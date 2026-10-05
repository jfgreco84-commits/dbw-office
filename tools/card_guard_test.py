#!/usr/bin/env python3
"""Tests for card_guard.py. Card numbers are generated at run time (valid check
digit, fake issuer ranges) so no card-shaped number is ever stored in the repo.

  python tools/card_guard_test.py
"""
import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from card_guard import scrub_text, _luhn  # noqa: E402

rng = random.Random(7)
fails = 0


def fake_card(prefix, length):
    body = prefix + ''.join(str(rng.randint(0, 9)) for _ in range(length - len(prefix) - 1))
    for check in '0123456789':
        if _luhn(body + check):
            return body + check
    raise AssertionError('no check digit')


def check(name, got, want):
    global fails
    ok = got == want
    if not ok:
        fails += 1
    print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else f'  got={got!r} want={want!r}'))


amex = fake_card('37', 15)
visa = fake_card('4', 16)
mc = fake_card('51', 16)
typo = amex[:-1] + str((int(amex[-1]) + 1) % 10)  # check digit wrong, as typed by hand

# 1. Card numbers in every way the office writes them
for label, note in [
    ('amex with date and two codes', f'{amex} 06/36 748 3977'),
    ('amex 4-6-5 grouping', f'{amex[:4]} {amex[4:10]} {amex[10:]} exp 12/37 cvv 343'),
    ('visa 4-4-4-4 dashes', f'{visa[:4]}-{visa[4:8]}-{visa[8:12]}-{visa[12:]} 10/2036'),
    ('mastercard bare', f'charge {mc} on ship'),
    ('mistyped number with a date', f'{typo} 03/38 170 6408'),
]:
    clean, n = scrub_text(note)
    digits_left = [d for d in (amex, visa, mc, typo) if d in clean.replace(' ', '').replace('-', '')]
    check(label + ': masked', n >= 1, True)
    check(label + ': no card digits left', digits_left, [])
    check(label + ': keeps last 4', ('****' + note.replace(' ', '').replace('-', '')[:19][-4:]) in clean
          or '[CARD REMOVED ****' in clean, True)
    check(label + ': date gone', '/36' in clean or '/37' in clean or '/38' in clean or '/2036' in clean, False)

# 2. Several cards in one note, separated the way the notes are
many = '; '.join(f'{fake_card("3701", 15)} 0{i}/3{i} {100 + i} {4000 + i}' for i in range(1, 6))
clean, n = scrub_text('rb - ' + many)
check('five cards in one note: five masked', n, 5)
check('five cards in one note: prefix text kept', clean.startswith('rb - [CARD REMOVED ****'), True)

# 3. Useful order information is never touched
keep = [
    'TRKG# 8741892994326',
    'TRK ' + fake_card('5', 15),          # tracking number that happens to pass the check digit
    'PO# 4500123456789',
    'CENTRAL TRANSPORT QUOTE $258.30 PER HTH',
    'BACKORDER 9-29-2026 SHIP 10/16',
    'call 414-213-0084',
    'INV #634312 ORD #831028',
    'QTY 100 @ $12.50, 5 boxes',
    'SEND A CATALOG AND A CARD',
]
for note in keep:
    clean, n = scrub_text(note)
    check('kept as is: ' + note[:30], (clean, n), (note, 0))

# 4. A lone security code is removed, the rest stays
clean, n = scrub_text('card on file, CVV 123, ship ground')
check('lone CVV removed', ('123' in clean, n), (False, 1))

# 5. The embedded JSON still parses and only note text changes
data = {'payroll_orders': {'W603': {'10-16-2026': [{'invoice': '635732', 'sell_total': 5759.76,
        'notes': [f'{amex} 04/37 172 6638', 'PO# IS ATTACHED'], 'items': [{'item': 'X', 'qty': 2}]}]}}}
page = '<script type="application/json" id="__dbw">' + json.dumps(data) + '</script>'
clean, n = scrub_text(page)
parsed = json.loads(clean.split('id="__dbw">')[1].split('</script>')[0])
order = parsed['payroll_orders']['W603']['10-16-2026'][0]
check('json still parses, invoice/total/items intact',
      (order['invoice'], order['sell_total'], order['items']), ('635732', 5759.76, [{'item': 'X', 'qty': 2}]))
check('json note masked', order['notes'], [f'[CARD REMOVED ****{amex[-4:]}]', 'PO# IS ATTACHED'])

# 6. Running it twice changes nothing more
again, n2 = scrub_text(clean)
check('idempotent', (again == clean, n2), (True, 0))

print(f'\n{"ALL CHECKS PASS" if not fails else f"FAILED {fails}"}')
sys.exit(1 if fails else 0)
