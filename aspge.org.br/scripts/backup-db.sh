#!/usr/bin/env bash
# Backup automatizado do PostgreSQL (ASPGE-PA)
# Uso: ./scripts/backup-db.sh
# Cron sugerido (diário 3h):  0 3 * * * /var/www/aspge/app/scripts/backup-db.sh >> /var/www/aspge/logs/backup.log 2>&1
set -euo pipefail

# Config
BACKUP_DIR="${BACKUP_DIR:-/var/www/aspge/backups}"
DB_NAME="${DB_NAME:-aspge_db}"
DB_USER="${DB_USER:-aspge}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/aspge_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Dump compactado
PGPASSWORD="${PGPASSWORD:-}" pg_dump \
  -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --format=custom --compress=9 --no-owner --no-privileges \
  -f "${FILE%.gz}" 2>/dev/null || \
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$FILE"

echo "[$(date '+%F %T')] Backup criado: $FILE"

# Retenção: remove backups mais antigos que RETENTION_DAYS
find "$BACKUP_DIR" -name 'aspge_*.sql*' -mtime +"$RETENTION_DAYS" -delete
echo "[$(date '+%F %T')] Retenção aplicada (> ${RETENTION_DAYS}d removidos)"
