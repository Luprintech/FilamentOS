#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  update.sh — Actualiza FilamentOS en el VPS desde GitHub
#
#  Uso:
#    bash /opt/filamentos/deploy/scripts/update.sh
#
#  Qué hace:
#    1. Hace git pull para traer los últimos cambios
#    2. Reconstruye la imagen Docker
#    3. Reinicia el contenedor con la nueva imagen
#    4. Muestra el estado final y los últimos logs
#
#  Downtime esperado: 5-15 segundos mientras Docker cambia de contenedor
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Para si algo falla

APP_DIR="/opt/filamentos"
COMPOSE_FILE="$APP_DIR/deploy/docker-compose.prod.yml"
CONTAINER_NAME="filamentos"

# Colores para que se lea bien
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  FilamentOS — Actualización de producción${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 1. Ir al directorio del proyecto ─────────────────────────────────────────
cd "$APP_DIR" || { echo -e "${RED}ERROR: No existe $APP_DIR${NC}"; exit 1; }

# ── 2. Mostrar estado git actual ──────────────────────────────────────────────
echo -e "${YELLOW}[1/4] Estado del repositorio...${NC}"
echo "  Rama actual: $(git branch --show-current)"
echo "  Último commit local: $(git log --oneline -1)"

# ── 3. Pull de GitHub ─────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/4] Descargando cambios de GitHub...${NC}"
git pull origin main

echo ""
echo "  Último commit tras pull: $(git log --oneline -1)"

# ── 4. Rebuild y restart ──────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/4] Reconstruyendo imagen Docker y reiniciando contenedor...${NC}"
echo "  (Esto tarda 1-5 min si hay cambios en dependencias, segundos si no)"
echo ""

docker build -t filamentos:latest .

docker compose -f "$COMPOSE_FILE" up -d --force-recreate

# ── 5. Verificar que está sano ────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/4] Verificando estado del contenedor...${NC}"
sleep 5  # Dar unos segundos para que arranque

STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no encontrado")
HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "sin healthcheck")

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$STATUS" = "running" ]; then
    echo -e "${GREEN}  ✓ Contenedor: $STATUS${NC}"
    echo -e "  ✓ Health: $HEALTH"
    echo -e "${GREEN}  ✓ Actualización completada correctamente${NC}"
else
    echo -e "${RED}  ✗ Contenedor: $STATUS — algo ha fallado${NC}"
    echo -e "${RED}  Revisa los logs: docker logs $CONTAINER_NAME${NC}"
fi

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Últimas líneas del log:"
echo ""
docker logs "$CONTAINER_NAME" --tail 20
echo ""
