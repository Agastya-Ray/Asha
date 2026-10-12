#!/usr/bin/env bash
# Runs one build command. If it fails, the last lines of its output are shown
# as an error note on the GitHub run page (easy to read without opening logs).
# Usage: scripts/ci-step.sh "Step name" command args...
name="$1"
shift
log="$(mktemp)"
set -o pipefail
"$@" 2>&1 | tee "$log"
code=${PIPESTATUS[0]}
if [ "$code" -ne 0 ]; then
  # Keep error-looking lines first, then the tail of the output.
  { grep -iE "error|exception|failed|what went wrong|cannot find|unresolved|e: " "$log" | head -40; echo "-----"; tail -40 "$log"; } > "$log.short"
  msg="$(sed -e 's/%/%25/g' "$log.short" | awk '{printf "%s%%0A", $0}')"
  echo "::error title=${name} failed::${msg}"
fi
exit "$code"
