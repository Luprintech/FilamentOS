#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  backup.sh  —  Snapshot consistente de SQLite + uploads para FilamentOS
#
#  Regla mnemotécnica: "C.R.U.D.O."
#    Copia consistente, Retención con fecha, Uploads incluidos, Destino externo, Observable.
#
#  Uso manual:
#     sudo /opt/filamentos/deploy/scripts/backup.sh
#
#  Cron (cada día a las 03:30):
#     sudo crontab -e
#     30 3 * * * /opt/filamentos/deploy/scripts/backup.sh >> /var/log/filamentos-backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuración (ajusta si cambias rutas) ──
CONTAINER="filamentos"
BACKUP_DIR="/var/backups/filamentos"
RETENTION_DAYS=14
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] === Backup FilamentOS iniciado ==="

# ── 1) Snapshot consistente del SQLite ──
#   NUNCA copies el .db mientras se está escribiendo: te llevas una DB corrupta.
#   sqlite3 .backup hace una copia atómica aunque la app esté en uso.
echo "[*] Copiando SQLite con sqlite3 .backup ..."
docker exec "$CONTAINER" sh -c \
  "apk add --no-cache sqlite >/dev/null 2>&1 || true; \
   sqlite3 /data/data.db \".backup '/data/backup_${TIMESTAMP}.db'\""

# Sacamos el snapshot fuera del contenedor al directorio del host.
docker cp "${CONTAINER}:/data/backup_${TIMESTAMP}.db" "${BACKUP_DIR}/data_${TIMESTAMP}.db"
docker exec "$CONTAINER" rm -f "/data/backup_${TIMESTAMP}.db"
gzip -9 "${BACKUP_DIR}/data_${TIMESTAMP}.db"
echo "    → ${BACKUP_DIR}/data_${TIMESTAMP}.db.gz"

# ── 2) Empaquetar uploads ──
echo "[*] Empaquetando uploads ..."
docker run --rm \
  -v deploy_uploads_data:/uploads:ro \
  -v "${BACKUP_DIR}:/backup" \
  alpine:3.20 \
  sh -c "tar czf /backup/uploads_${TIMESTAMP}.tar.gz -C /uploads ."
echo "    → ${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"

# ── 3) Retención: borrar lo más viejo de RETENTION_DAYS días ──
echo "[*] Limpiando backups con más de ${RETENTION_DAYS} días ..."
find "$BACKUP_DIR" -type f -name 'data_*.db.gz'    -mtime +$RETENTION_DAYS -print -delete
find "$BACKUP_DIR" -type f -name 'uploads_*.tar.gz' -mtime +$RETENTION_DAYS -print -delete

# ── 4) Observable: tamaño final y recuento ──
echo "[*] Estado actual del directorio de backups:"
du -sh "$BACKUP_DIR"
ls -1 "$BACKUP_DIR" | tail -n 6

echo "[$(date -Iseconds)] === Backup FilamentOS OK ==="

# ── Recomendado: replica a otro lugar (rsync a otro host, rclone a S3/B2, etc.) ──
#   Un backup que vive en el mismo VPS que los datos NO es un backup de verdad.
#   Ejemplo con rclone (requiere configuración previa: rclone config):
#     rclone copy "${BACKUP_DIR}" remote:filamentos-backups --max-age 2d
