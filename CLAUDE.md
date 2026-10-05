# dbw-office: rules for any automation or agent working here

This repo is public and is served as the DBW office site (GitHub Pages from `main`).

## Customer card data: never publish it

ShipSheet order notes sometimes contain a customer's card number, expiration date
and security codes. They must never be committed.

Before every commit that touches `rep.html`, `index.html`, `board.html` or any data file:

1. Once per clone, turn on the guard hook (it masks card data automatically on commit):
   `git config core.hooksPath tools/hooks`
2. If the hook can't run, mask by hand before committing:
   `python tools/card_guard.py --fix rep.html index.html board.html`
3. Never print, copy or log card numbers, even in summaries or error messages.

A GitHub workflow (`.github/workflows/card-guard.yml`) also masks anything that gets
through and emails the owner, but a commit that carries card data is still exposed
in history, so the guard has to run before commit.

## Ownership

Claude (the dashboard maintainer session) owns this repo's code: `rep.html`,
`index.html`, `board.html` and `tools/`. The desktop automations only rewrite the
embedded data blocks. Agree changes to page code with the owner (Froggy) first so
two agents never edit the same files.
