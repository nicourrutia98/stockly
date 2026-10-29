#!/usr/bin/env bash
# Stockly — supervisor de la demo.
#   web :3000 · backend :8080 · postgres :5433 · redis :6379
# Postgres nativo del host ocupa el 5432, por eso el backend apunta a 5433.
# Uso:  bash scripts/stack.sh start|stop|status
set -uo pipefail

ROOT="/home/usco/Desktop/urrutia/ia 1 oc"
RUN=/tmp/opencode/stack
mkdir -p "$RUN"

start_pg() {
  docker start stockly-postgres-5433 >/dev/null 2>&1
  for _ in $(seq 1 30); do
    PGPASSWORD=stockly_dev psql -h localhost -p 5433 -U stockly -d stockly \
      -c 'select 1' >/dev/null 2>&1 && { echo "  postgres:5433 listo"; return 0; }
    sleep 1
  done
  echo "  postgres:5433 NO levanto"; return 1
}

start_backend() {
  pkill -f 'spring-boot:run' 2>/dev/null
  pkill -f 'com.stockly' 2>/dev/null
  sleep 2
  ( cd "$ROOT/apps/backend" && setsid nohup env \
      DATABASE_URL="jdbc:postgresql://localhost:5433/stockly" \
      mvn -q spring-boot:run > "$RUN/backend.log" 2>&1 < /dev/null & )
  for _ in $(seq 1 90); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 \
      "http://localhost:8080/api/v1/products?page=0&size=1" 2>/dev/null)
    [ "$code" = "200" ] && { echo "  backend:8080 listo"; return 0; }
    sleep 2
  done
  echo "  backend:8080 NO levanto (ver $RUN/backend.log)"; return 1
}

start_web() {
  pkill -f 'next dev' 2>/dev/null
  sleep 2
  ( cd "$ROOT/apps/web" && setsid nohup pnpm dev > "$RUN/web.log" 2>&1 < /dev/null & )
  for _ in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/ 2>/dev/null)
    [ "$code" = "200" ] && { echo "  web:3000 listo"; return 0; }
    sleep 2
  done
  echo "  web:3000 NO levanto (ver $RUN/web.log)"; return 1
}

case "${1:-start}" in
  start)
    echo "levantando Stockly…"
    docker start stockly-redis >/dev/null 2>&1
    start_pg     && start_backend && start_web
    echo; bash "$0" status
    ;;
  stop)
    pkill -f 'spring-boot:run' 2>/dev/null
    pkill -f 'com.stockly'      2>/dev/null
    pkill -f 'next dev'         2>/dev/null
    echo "frontend y backend detenidos (infra docker sigue arriba)"
    ;;
  status)
    for s in "web      http://localhost:3000/" \
             "api      http://localhost:8080/api/v1/products?page=0&size=1"; do
      set -- $s
      printf '  %-8s %s  %s\n' "$1" \
        "$(curl -s -o /dev/null -w '%{http_code}' --max-time 6 "$2")" "$2"
    done
    printf '  %-8s %s\n' "pg:5433" \
      "$(PGPASSWORD=stockly_dev psql -h localhost -p 5433 -U stockly -d stockly -tAc 'select count(*)||" productos" from products' 2>/dev/null)"
    printf '  %-8s %s\n' "redis" \
      "$(docker exec stockly-redis redis-cli ping 2>/dev/null || echo 'caido')"
    ;;
  *) echo "uso: $0 start|stop|status"; exit 1 ;;
esac