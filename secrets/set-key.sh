#!/usr/bin/env bash
# ============================================================
# HAM-HEAD AI — ADD / UPDATE YOUR CLAUDE API KEY
#
# Prompts for the key with hidden input, checks it with Anthropic,
# stores it in secrets/tokens.env (chmod 600) and can push it to the
# live server. The key is never echoed, passed as a command-line
# argument, or written to shell history.
#
# USAGE:
#   npm run key:set            — prompt, verify, save (asks about server)
#   bash secrets/set-key.sh --offline   — skip the online check
# ============================================================

set -euo pipefail
umask 077

SECRETS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SECRETS_DIR/tokens.env"
VAULT_FILE="$SECRETS_DIR/vault.enc"
EXAMPLE_FILE="$SECRETS_DIR/tokens.env.example"
REMOTE_DIR="/opt/hamhead-ai"
VAR="ANTHROPIC_API_KEY"
OFFLINE=0
[[ "${1:-}" == "--offline" ]] && OFFLINE=1

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }
ask()  { local a; read -rp "  $1 [y/N] " a; [[ "$a" =~ ^[Yy]$ ]]; }

API_KEY=""
cleanup() { unset API_KEY; }
trap cleanup EXIT

echo -e "${BOLD}${CYAN}"
echo "  🐷 HAM-HEAD AI — CLAUDE API KEY"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# ── 1. Make sure tokens.env is available ──────────────────
UNLOCKED_HERE=0
if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$VAULT_FILE" ]]; then
    echo "  Your secrets are locked in the vault. Unlocking them first."
    bash "$SECRETS_DIR/vault.sh" unlock
    [[ -f "$ENV_FILE" ]] || err "Vault did not unlock."
    UNLOCKED_HERE=1
  else
    cp "$EXAMPLE_FILE" "$ENV_FILE"
    warn "Created secrets/tokens.env from the example. Fill in your other values later."
  fi
fi
chmod 600 "$ENV_FILE"

# ── 2. Read the key (hidden) ──────────────────────────────
echo "  Paste your Claude API key and press Enter."
echo "  (Nothing will show while you paste. That's on purpose.)"
read -rsp "  Key: " API_KEY
echo ""
API_KEY="$(printf '%s' "$API_KEY" | tr -d '[:space:]')"
[[ -n "$API_KEY" ]] || err "No key entered."
[[ "$API_KEY" =~ ^sk-ant-[A-Za-z0-9_-]{20,}$ ]] || err "That doesn't look like a Claude API key (it should start with sk-ant-)."
ok "Received key ending in …${API_KEY: -4}"

# ── 3. Check it with Anthropic ────────────────────────────
if [[ $OFFLINE -eq 0 ]]; then
  echo "  Checking the key with Anthropic…"
  # Headers are read from stdin so the key never appears in the process list.
  CODE=$(printf 'x-api-key: %s\nanthropic-version: 2023-06-01\n' "$API_KEY" \
    | curl -sS -o /dev/null -w '%{http_code}' -H @- https://api.anthropic.com/v1/models 2>/dev/null || echo 000)
  case "$CODE" in
    200) ok "Anthropic accepted the key" ;;
    401|403) err "Anthropic rejected this key (HTTP $CODE). Check you copied all of it, or create a new one." ;;
    *) warn "Couldn't confirm the key right now (HTTP $CODE)."
       ask "Save it anyway?" || err "Nothing saved." ;;
  esac
fi

# ── 4. Save to tokens.env ─────────────────────────────────
TMP="$(mktemp "$SECRETS_DIR/.tokens.XXXXXX")"
# The key reaches awk through the environment, not argv.
NEWKEY="$API_KEY" awk -v var="$VAR" '
  BEGIN { done = 0 }
  $0 ~ "^" var "=" { if (!done) { print var "=" ENVIRON["NEWKEY"]; done = 1 } ; next }
  { print }
  END { if (!done) { print ""; print "# Claude API key (Stub app AI features)"; print var "=" ENVIRON["NEWKEY"] } }
' "$ENV_FILE" > "$TMP"
chmod 600 "$TMP"
mv "$TMP" "$ENV_FILE"
ok "Saved to secrets/tokens.env (only your user can read it; git ignores it)"

# ── 5. Optionally update the live server ──────────────────
echo ""
if ask "Send the key to your live server now and restart the API?"; then
  set +u; source "$ENV_FILE"; set -u
  : "${HOSTINGER_SSH_HOST:?Set HOSTINGER_SSH_HOST in secrets/tokens.env}"
  : "${HOSTINGER_SSH_USER:?Set HOSTINGER_SSH_USER in secrets/tokens.env}"
  : "${HOSTINGER_SSH_KEY_PATH:?Set HOSTINGER_SSH_KEY_PATH in secrets/tokens.env}"
  SSH_KEY="${HOSTINGER_SSH_KEY_PATH/#\~/$HOME}"
  [[ -f "$SSH_KEY" ]] || err "SSH key not found at $SSH_KEY"
  # The key travels inside the encrypted SSH connection on stdin.
  OUT=$(printf '%s\n' "$API_KEY" | ssh -i "$SSH_KEY" -o ConnectTimeout=20 \
    "${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}" "set -e
      cd $REMOTE_DIR
      umask 077
      read -r K
      touch .env
      grep -v '^$VAR=' .env > .env.tmp || true
      printf '%s=%s\n' '$VAR' \"\$K\" >> .env.tmp
      mv .env.tmp .env
      unset K
      if grep -q '$VAR' docker-compose.yaml; then
        docker compose -f docker-compose.yaml up -d server >/dev/null 2>&1 && echo RESTARTED
      else
        echo NEEDS_DEPLOY
      fi") || err "Couldn't update the server. Check SSH access with: npm run deploy:check"
  case "$OUT" in
    *RESTARTED*) ok "Server updated and API restarted. AI is on at https://ham-headai.com/apps/stub/" ;;
    *NEEDS_DEPLOY*) warn "Key saved on the server, but it's running older code. Run: npm run deploy" ;;
    *) warn "Key saved on the server, but the API didn't restart cleanly. Run: npm run deploy:restart" ;;
  esac
else
  echo "  Skipped. The next 'npm run deploy' will send the key to the server."
fi

# ── 6. Re-lock the vault ──────────────────────────────────
echo ""
if [[ $UNLOCKED_HERE -eq 1 ]] || [[ -f "$VAULT_FILE" ]]; then
  if ask "Re-lock your secrets vault now?"; then
    bash "$SECRETS_DIR/vault.sh" lock
  else
    warn "secrets/tokens.env is still unlocked. Run 'npm run vault:lock' when you're done."
  fi
fi
ok "Done."
