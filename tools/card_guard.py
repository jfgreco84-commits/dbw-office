#!/usr/bin/env python3
"""Card-data guard for the DBW office site.

Order notes copied from the ShipSheet can carry a customer's full card number,
expiration date and security codes. None of that may ever be published. This
masks card numbers to "[CARD REMOVED ****1234]" and drops the expiration date
and codes that follow, leaving the rest of the note (and the file) untouched.

It never prints card data: output is counts and file names only.

  python tools/card_guard.py --check FILE...   exit 1 if any card data is found
  python tools/card_guard.py --fix FILE...     mask it in place (exit 0)

Used by tools/hooks/pre-commit (before every commit on a PC) and by
.github/workflows/card-guard.yml (on every push, and before the site deploys).
"""
import re
import sys

# A run of 13-19 digits, optionally grouped with single spaces or dashes
# (Amex is often written 4-6-5), followed by an optional expiration date and
# up to two 3-4 digit codes ("3701... 06/36 748 3977").
_CARDISH = re.compile(
    r'(?<![\d/])'
    r'(?P<pan>\d{12,19}|\d{4}[ -]\d{6}[ -]\d{4,5}|\d{4}(?:[ -]\d{4}){2,3}(?:[ -]\d{1,3}(?![\d/]))?)(?!\d)'
    r'(?P<exp>\s*(?:exp\.?|expires?)?\s*(?:0?[1-9]|1[0-2])\s*/\s*(?:\d{4}|\d{2}))?'
    r'(?P<codes>(?:\s*(?:cvv|cvc|cid|sec(?:urity)?\s*code)?[:#]?\s*\d{3,4}(?![\d/])){0,2})',
    re.IGNORECASE,
)
# Carrier/PO labels just before a long number mean it is not a card.
_NOT_A_CARD = re.compile(r'(trk|trkg|track(?:ing)?|pro|po|bol|fedex|ups|usps|inv(?:oice)?|ord(?:er)?)\s*#?\s*:?\s*$',
                         re.IGNORECASE)
# A security code written out on its own ("CVV 123", "sec code: 4567").
_LONE_CODE = re.compile(r'\b(cvv2?|cvc2?|cid|sec(?:urity)?\s*code)\s*[:#]?\s*\d{3,4}\b', re.IGNORECASE)

_MASK = '[CARD REMOVED ****{}]'


def _luhn(digits):
    total = 0
    for i, ch in enumerate(reversed(digits)):
        d = int(ch)
        if i % 2:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def _is_card(digits, has_exp):
    if not 12 <= len(digits) <= 19:
        return False
    # A number followed by an expiration date is card data even when mistyped.
    if has_exp:
        return True
    return 13 <= len(digits) <= 19 and digits[0] in '3456' and _luhn(digits)


def scrub_text(text):
    """Return (clean_text, number_of_items_masked)."""
    count = 0

    def repl(m):
        nonlocal count
        digits = re.sub(r'\D', '', m.group('pan'))
        has_exp = bool(m.group('exp'))
        if not _is_card(digits, has_exp):
            return m.group(0)
        if not has_exp and _NOT_A_CARD.search(text[max(0, m.start() - 12):m.start()]):
            return m.group(0)
        count += 1
        # The whole match goes: number, expiration date and the codes after it.
        return _MASK.format(digits[-4:])

    text = _CARDISH.sub(repl, text)

    def code_repl(m):
        nonlocal count
        count += 1
        return '[CODE REMOVED]'

    text = _LONE_CODE.sub(code_repl, text)
    return text, count


def find_count(text):
    return scrub_text(text)[1]


def main(argv):
    if len(argv) < 2 or argv[0] not in ('--check', '--fix'):
        print(__doc__.strip().splitlines()[0])
        print('usage: card_guard.py --check|--fix FILE...')
        return 2
    mode, files = argv[0], argv[1:]
    found_any = False
    for path in files:
        try:
            with open(path, encoding='utf-8') as f:
                text = f.read()
        except (OSError, UnicodeDecodeError):
            continue  # binary or missing: nothing we publish as text
        clean, n = scrub_text(text)
        if not n:
            continue
        found_any = True
        if mode == '--fix':
            with open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(clean)
            print(f'card-guard: masked {n} card item(s) in {path}')
        else:
            print(f'card-guard: {n} card item(s) found in {path}')
    if mode == '--check' and found_any:
        print('card-guard: card data must not be published. Run: python tools/card_guard.py --fix <file>')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
