#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-infrastructure/docker/docker-compose.yml}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Starting stack (build if needed)..."
docker compose -f "$COMPOSE_FILE" up --build -d

echo "==> Waiting for services to become healthy..."
deadline=$((SECONDS + 300))
while [ "$SECONDS" -lt "$deadline" ]; do
  unhealthy="$(docker compose -f "$COMPOSE_FILE" ps --format json | node -e "
    const lines = require('fs').readFileSync(0,'utf8').trim().split('\n').filter(Boolean);
    const bad = lines
      .map((l) => JSON.parse(l))
      .filter((s) => s.Health && s.Health !== 'healthy');
    process.stdout.write(String(bad.length));
  ")"
  if [ "$unhealthy" = "0" ]; then
    break
  fi
  sleep 5
done

echo
docker compose -f "$COMPOSE_FILE" ps

check() {
  local name="$1"
  local url="$2"
  local code
  code="$(curl -s -o /tmp/verify-body.txt -w "%{http_code}" "$url")"
  if [ "$code" -ge 200 ] && [ "$code" -lt 400 ]; then
    echo "OK  $name ($code) $url"
    head -c 200 /tmp/verify-body.txt
    echo
  else
    echo "FAIL $name ($code) $url"
    cat /tmp/verify-body.txt || true
    exit 1
  fi
}

echo "==> HTTP checks"
check "API health" "http://localhost:3001/api/health"
check "Swagger" "http://localhost:3001/api/docs"
check "Package search" "http://localhost:3001/api/packages/search?limit=1"
check "Destinations" "http://localhost:3001/api/packages/destinations"
check "Frontend" "http://localhost:3000/"

echo "==> All checks passed. Stack is ready."
