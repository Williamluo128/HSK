#!/usr/bin/env bash
# Sync schema + 40 lessons from local MySQL (:3309) to remote (Aiven).
#
#   export DATABASE_URL='mysql://user:pass@host:port/defaultdb?ssl-mode=REQUIRED'
#   ./scripts/sync-local-db-to-remote.sh
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Set DATABASE_URL (Aiven MySQL Service URI) first." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

parse_url() {
  node -e "
    const raw = process.env.DATABASE_URL.replace(/^mysql:/, 'http:');
    const u = new URL(raw);
    const q = u.searchParams;
    console.log([
      u.hostname,
      u.port || '3306',
      decodeURIComponent(u.username),
      decodeURIComponent(u.password),
      u.pathname.replace(/^\//, '') || 'defaultdb',
      q.get('ssl-mode') || 'REQUIRED',
    ].join('\t'));
  "
}

IFS=$'\t' read -r DB_HOST DB_PORT DB_USER DB_PASS DB_NAME DB_SSL <<< "$(parse_url)"

echo "→ prisma db push → ${DB_HOST}:${DB_PORT}/${DB_NAME}"
npx prisma db push

echo "→ import lesson tables from local hsk@127.0.0.1:3309"
mysqldump -h127.0.0.1 -P3309 -uroot hsk \
  --no-tablespaces --no-create-info --skip-triggers \
  --tables lessons lesson_sections words dialogue_lines \
  | mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" --ssl-mode="$DB_SSL"

echo "→ npm run db:seed"
npm run db:seed

echo "→ remote lesson count:"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" --ssl-mode="$DB_SSL" \
  -e "SELECT COUNT(*) AS lessons FROM lessons;"

echo "Done."
