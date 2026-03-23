#!/usr/bin/env bash
# ============================================================
# HAM-HEAD AI — HOSTINGER VPS DEPLOYMENT SCRIPT
# ============================================================
# Uses Hostinger API to verify VPS, then deploys via SSH.
#
# Prerequisites:
#   - secrets/tokens.env populated (run: npm run vault:unlock)
#   - SSH key on the VPS (id_ed25519 or custom key)
#   - Git repo pushed to GitHub
#
# Usage:
#   bash deploy.sh              — full deploy
#   bash deploy.sh --check      — verify API + SSH only
#   bash deploy.sh --restart    — restart containers only
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS_FILE="$SCRIPT_DIR/secrets/tokens.env"
REMOTE_DIR="/opt/hamhead-ai"
DOMAIN="ham-headai.com"
ACME_EMAIL="admin@ham-headai.com"
APP_NETWORK="hamhead-ai_app-net"

# ── VPS (auto-discovered via Hostinger API) ───────────────
VPS_ID=1472371
VPS_IP="187.124.144.214"
VPS_HOSTNAME="srv1472371.hstgr.cloud"

# ── Colors ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${CYAN}${BOLD}[DEPLOY]${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "${RED}✗  ERROR:${NC} $1"; exit 1; }

MODE="${1:-}"

# ── Banner ────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}"
echo "  🐷 HAM-HEAD AI — HOSTINGER DEPLOY"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# ── Load secrets ──────────────────────────────────────────
[[ -f "$SECRETS_FILE" ]] || err "secrets/tokens.env not found. Run: npm run vault:unlock"
# shellcheck source=/dev/null
source "$SECRETS_FILE"

: "${HOSTINGER_API_TOKEN:?Set HOSTINGER_API_TOKEN in secrets/tokens.env}"
: "${HOSTINGER_SSH_HOST:?Set HOSTINGER_SSH_HOST in secrets/tokens.env}"
: "${HOSTINGER_SSH_USER:?Set HOSTINGER_SSH_USER in secrets/tokens.env}"
: "${HOSTINGER_SSH_KEY_PATH:?Set HOSTINGER_SSH_KEY_PATH in secrets/tokens.env}"
: "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in secrets/tokens.env}"
: "${JWT_SECRET:?Set JWT_SECRET in secrets/tokens.env}"

SSH_KEY="${HOSTINGER_SSH_KEY_PATH/#\~/$HOME}"
[[ -f "$SSH_KEY" ]] || err "SSH key not found at $SSH_KEY"

# ── Hostinger API — VPS status check ─────────────────────
log "Querying Hostinger API..."
HTTP_RESP=$(curl -s -o /tmp/hapi_resp.json -w "%{http_code}" \
  -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
  -H "Accept: application/json" \
  "https://api.hostinger.com/v1/vps/virtual-machines" 2>/dev/null || echo "000")

if [[ "$HTTP_RESP" == "200" ]]; then
  ok "Hostinger API connected"
  # Find VPS matching our SSH host
  if command -v jq &>/dev/null; then
    VPS_STATE=$(jq -r --arg host "$HOSTINGER_SSH_HOST" \
      '[.[] | select(.ipv4 == $host or .hostname == $host)] | first | .state // "unknown"' \
      /tmp/hapi_resp.json 2>/dev/null || echo "unknown")
    if [[ "$VPS_STATE" == "running" ]]; then
      ok "VPS state: running"
    else
      warn "VPS state: ${VPS_STATE} — proceeding anyway"
    fi
  else
    ok "VPS response received (install jq for detailed status)"
  fi
elif [[ "$HTTP_RESP" == "401" ]]; then
  err "Hostinger API: 401 Unauthorized — check HOSTINGER_API_TOKEN"
else
  warn "Hostinger API returned HTTP $HTTP_RESP — proceeding with SSH deployment"
fi

# ── SSH helpers ───────────────────────────────────────────
_ssh() {
  ssh -i "$SSH_KEY" \
      -o StrictHostKeyChecking=no \
      -o ConnectTimeout=20 \
      -o ServerAliveInterval=60 \
      "${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}" "$@"
}

# ── Test SSH ─────────────────────────────────────────────
log "Testing SSH → ${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}..."
_ssh "echo 'SSH OK'" 2>&1 | grep -q "SSH OK" || err "SSH failed — check host/user/key"
ok "SSH connection established"

[[ "$MODE" == "--check" ]] && { ok "Check complete."; exit 0; }

# ── Restart-only mode ─────────────────────────────────────
if [[ "$MODE" == "--restart" ]]; then
  log "Restarting containers..."
  _ssh "cd $REMOTE_DIR && docker compose -f docker-compose.yaml restart"
  ok "Containers restarted"; exit 0
fi

# ── Ensure Docker is installed on VPS ────────────────────
log "Checking Docker on VPS..."
if ! _ssh "docker info &>/dev/null"; then
  log "Installing Docker..."
  _ssh "curl -fsSL https://get.docker.com | sh"
  _ssh "sudo usermod -aG docker \"\$USER\" || true"
  ok "Docker installed"
else
  ok "Docker ready: $(_ssh 'docker --version')"
fi

# ── Setup app directory & pull latest code ────────────────
log "Setting up $REMOTE_DIR..."
_ssh "mkdir -p $REMOTE_DIR"

# Detect if repo exists or needs initial clone
REPO_EXISTS=$(_ssh "[ -d $REMOTE_DIR/.git ] && echo yes || echo no")
if [[ "$REPO_EXISTS" == "yes" ]]; then
  log "Pulling latest code..."
  _ssh "cd $REMOTE_DIR && git fetch --all && git reset --hard origin/main"
  ok "Code updated"
else
  # Sync files via scp (no git required on remote)
  log "Copying project files to VPS..."
  cd "$SCRIPT_DIR"

  # Create a temp tarball (exclude heavy/sensitive dirs)
  tar czf /tmp/hamhead-deploy.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*/node_modules' \
    --exclude='secrets/tokens.env' \
    --exclude='secrets/vault.enc' \
    --exclude='client/.env' \
    --exclude='server/.env' \
    .

  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    /tmp/hamhead-deploy.tar.gz \
    "${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}:/tmp/hamhead-deploy.tar.gz"

  _ssh "tar xzf /tmp/hamhead-deploy.tar.gz -C $REMOTE_DIR && rm /tmp/hamhead-deploy.tar.gz"
  rm -f /tmp/hamhead-deploy.tar.gz
  ok "Files deployed to VPS"
fi

# ── Write production .env on VPS ─────────────────────────
log "Writing production environment..."
_ssh "cat > $REMOTE_DIR/.env << 'ENVEOF'
POSTGRES_USER=hamhead
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=hamheadai
JWT_SECRET=${JWT_SECRET}
NODE_ENV=production
ENVEOF"
ok ".env written"

# ── Setup Traefik (reverse proxy + SSL) ──────────────────
log "Checking Traefik..."
TRAEFIK_RUNNING=$(_ssh "docker ps --filter 'name=traefik' --format '{{.Names}}' 2>/dev/null || echo ''")

if [[ -z "$TRAEFIK_RUNNING" ]]; then
  log "Starting Traefik with Let's Encrypt..."
  _ssh "
    mkdir -p /opt/traefik/letsencrypt
    touch /opt/traefik/letsencrypt/acme.json
    chmod 600 /opt/traefik/letsencrypt/acme.json

    # Remove old traefik container if stopped
    docker rm -f traefik 2>/dev/null || true

    docker run -d \
      --name traefik \
      --restart unless-stopped \
      -p 80:80 \
      -p 443:443 \
      -v /var/run/docker.sock:/var/run/docker.sock:ro \
      -v /opt/traefik/letsencrypt:/letsencrypt \
      traefik:v3.0 \
        --api.insecure=false \
        --providers.docker=true \
        --providers.docker.exposedbydefault=false \
        --providers.docker.network=${APP_NETWORK} \
        --entrypoints.web.address=:80 \
        --entrypoints.websecure.address=:443 \
        --certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL} \
        --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json \
        --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
  "
  ok "Traefik started"
else
  ok "Traefik already running ($TRAEFIK_RUNNING)"
fi

# ── Deploy the app ────────────────────────────────────────
log "Building & starting Ham-Head AI..."
_ssh "
  cd $REMOTE_DIR
  docker compose -f docker-compose.yaml down --remove-orphans 2>/dev/null || true
  docker compose -f docker-compose.yaml build --no-cache
  docker compose -f docker-compose.yaml up -d
"
ok "Containers started"

# ── Connect Traefik to app network ────────────────────────
log "Connecting Traefik to app network..."
_ssh "
  docker network connect ${APP_NETWORK} traefik 2>/dev/null \
    && echo 'Connected' \
    || echo 'Already connected or skipped'
"
ok "Network wired"

# ── Health check ─────────────────────────────────────────
log "Waiting for app to become healthy (30s)..."
sleep 30

HEALTH=$(_ssh "curl -sf http://localhost:5000/api/health 2>/dev/null || echo FAILED")
if echo "$HEALTH" | grep -q '"status":"OK"'; then
  ok "API health check passed"
else
  warn "API health returned: $HEALTH"
  warn "Check logs: ssh -i $SSH_KEY ${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST} 'docker logs hamhead-api'"
fi

# ── Done ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  🐷 HAM-HEAD AI DEPLOYED${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Site:    ${CYAN}https://${DOMAIN}${NC}"
echo -e "  API:     ${CYAN}https://${DOMAIN}/api/health${NC}"
echo -e "  Server:  ${CYAN}${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}${NC}"
echo ""
echo -e "  Logs:    ${YELLOW}npm run deploy:logs${NC}"
echo -e "  Restart: ${YELLOW}bash deploy.sh --restart${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
