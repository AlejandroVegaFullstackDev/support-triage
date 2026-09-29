#!/usr/bin/env bash
# End-to-end check: create a ticket and wait until the triage agent classifies it.
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-60}"

ticket_id=$(curl -fsS -X POST "$API_URL/tickets" \
  -H 'Content-Type: application/json' \
  -d '{"subject":"La app está caída","body":"No carga el mapa del GPS desde las 8 am, es urgente","customerEmail":"smoke@example.com"}' \
  | python3 -c 'import sys, json; print(json.load(sys.stdin)["id"])')
echo "Created ticket $ticket_id"

deadline=$((SECONDS + TIMEOUT_SECONDS))
while (( SECONDS < deadline )); do
  ticket=$(curl -fsS "$API_URL/tickets/$ticket_id")
  status=$(python3 -c 'import sys, json; print(json.load(sys.stdin)["status"])' <<<"$ticket")
  if [[ "$status" == "triaged" ]]; then
    echo "Triaged: $ticket"
    exit 0
  fi
  sleep 1
done

echo "Ticket $ticket_id was not triaged within ${TIMEOUT_SECONDS}s" >&2
exit 1
