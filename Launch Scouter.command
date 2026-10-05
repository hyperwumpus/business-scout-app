#!/bin/zsh -l
cd -- "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  print 'Scouter requires Node.js 20 or newer. See README.md for setup.'
  read '?Press Enter to close.'
  exit 1
fi
print 'Open http://127.0.0.1:4173 to use Scouter. Keep this window open.'
open http://127.0.0.1:4173
node server.mjs
