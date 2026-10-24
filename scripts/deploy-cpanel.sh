#!/bin/bash
set -eu

# cPanel runs this script from the checked-out repository root.
# Build and commit dist/ locally; the hosting account needs no Node.js runtime.
if [ ! -s dist/index.html ] || [ ! -s dist/playground/BubbleBattle.html ] || [ ! -s dist/playground/ThreeCapture.html ] || [ ! -d dist/_astro ]; then
  echo 'Missing website build. Run npm run build locally, then commit and push dist/.' >&2
  exit 1
fi

: "${DEPLOYPATH:?Set DEPLOYPATH to the cPanel document root}"
case "$DEPLOYPATH" in
  /) echo 'The deployment destination cannot be the filesystem root.' >&2; exit 1 ;;
  /*) ;;
  *) echo 'DEPLOYPATH must be an absolute path.' >&2; exit 1 ;;
esac

/bin/mkdir -p -- "$DEPLOYPATH"
# Copy only the built public files, including dotfiles such as .htaccess.
# Preserve other files already hosted in public_html.
/bin/cp -R -- dist/. "$DEPLOYPATH"
echo "Static website deployed to $DEPLOYPATH"
