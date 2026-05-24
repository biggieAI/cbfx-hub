#!/usr/bin/env bash
# CBFX Hub — refresh "Last updated" dates in docs/ from git log.
#
# For each docs/*.html, finds the most recent commit that touched the file
# and rewrites the <span class="docs-footer-meta">Last updated YYYY-MM-DD</span>
# value in place.
#
# Run after editing docs, before committing. Idempotent.
#
# Usage:
#   ./tools/refresh-docs-dates.sh
#
# Or include in a pre-commit hook.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

shopt -s nullglob
for f in docs/*.html; do
  # Most recent commit date for this file (ISO short: YYYY-MM-DD).
  # If the file is staged but not yet committed, fall back to today.
  date=$(git log --format=%cs -1 -- "$f" || true)
  if [ -z "$date" ]; then
    date=$(date +%Y-%m-%d)
  fi

  # Update in-place. Pattern allows any existing YYYY-MM-DD value.
  sed -i -E "s|<span class=\"docs-footer-meta\">Last updated [0-9]{4}-[0-9]{2}-[0-9]{2}</span>|<span class=\"docs-footer-meta\">Last updated ${date}</span>|" "$f"
done

echo "Refreshed Last updated dates:"
grep -h "Last updated" docs/*.html | sort -u
