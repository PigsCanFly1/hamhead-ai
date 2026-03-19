#!/usr/bin/env bash
# ============================================================
# HAM-HEAD AI — SECURE VAULT MANAGER
# AES-256-CBC encrypted secrets storage using OpenSSL
#
# USAGE:
#   ./secrets/vault.sh lock    — encrypt tokens.env → vault.enc
#   ./secrets/vault.sh unlock  — decrypt vault.enc  → tokens.env
#   ./secrets/vault.sh load    — export secrets into current shell
#   ./secrets/vault.sh status  — show vault state
#   ./secrets/vault.sh docker  — login to Docker Hub
#   ./secrets/vault.sh help    — show this help
# ============================================================

SECRETS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SECRETS_DIR/tokens.env"
VAULT_FILE="$SECRETS_DIR/vault.enc"
EXAMPLE_FILE="$SECRETS_DIR/tokens.env.example"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

banner() {
  echo -e "${BOLD}${CYAN}"
  echo "  🐷 HAM-HEAD AI VAULT MANAGER"
  echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${NC}"
}

cmd_help() {
  banner
  echo -e "  ${BOLD}COMMANDS${NC}"
  echo -e "  ${CYAN}lock${NC}    Encrypt tokens.env → vault.enc (then delete plaintext)"
  echo -e "  ${CYAN}unlock${NC}  Decrypt vault.enc → tokens.env"
  echo -e "  ${CYAN}load${NC}    Source secrets into current shell session"
  echo -e "  ${CYAN}status${NC}  Show which vault files exist"
  echo -e "  ${CYAN}docker${NC}  Login to Docker Hub using stored credentials"
  echo -e "  ${CYAN}edit${NC}    Unlock vault, open editor, re-lock on save"
  echo -e "  ${CYAN}help${NC}    Show this help"
  echo ""
  echo -e "  ${BOLD}QUICKSTART${NC}"
  echo -e "  1. cp secrets/tokens.env.example secrets/tokens.env"
  echo -e "  2. Edit secrets/tokens.env with your real tokens"
  echo -e "  3. ./secrets/vault.sh lock   # encrypts & removes plaintext"
  echo -e "  4. ./secrets/vault.sh unlock # when you need to read/edit"
  echo ""
}

check_openssl() {
  if ! command -v openssl &>/dev/null; then
    echo -e "${RED}✗ OpenSSL not found. Install it first.${NC}"
    exit 1
  fi
}

cmd_lock() {
  check_openssl
  if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗ No tokens.env found at: $ENV_FILE${NC}"
    echo -e "  Run: cp $EXAMPLE_FILE $ENV_FILE"
    exit 1
  fi

  echo -n "  Enter vault password: "
  read -rs VAULT_PASS
  echo ""
  echo -n "  Confirm password: "
  read -rs VAULT_PASS2
  echo ""

  if [ "$VAULT_PASS" != "$VAULT_PASS2" ]; then
    echo -e "${RED}✗ Passwords do not match.${NC}"
    exit 1
  fi

  openssl enc -aes-256-cbc -pbkdf2 -iter 100000 \
    -in "$ENV_FILE" \
    -out "$VAULT_FILE" \
    -k "$VAULT_PASS"

  if [ $? -eq 0 ]; then
    # Securely delete plaintext
    if command -v shred &>/dev/null; then
      shred -u "$ENV_FILE"
    else
      rm -f "$ENV_FILE"
    fi
    echo -e "${GREEN}✓ Vault locked: vault.enc (plaintext deleted)${NC}"
  else
    echo -e "${RED}✗ Encryption failed.${NC}"
    exit 1
  fi
}

cmd_unlock() {
  check_openssl
  if [ ! -f "$VAULT_FILE" ]; then
    echo -e "${RED}✗ No vault.enc found. Run 'lock' first.${NC}"
    exit 1
  fi

  echo -n "  Enter vault password: "
  read -rs VAULT_PASS
  echo ""

  openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
    -in "$VAULT_FILE" \
    -out "$ENV_FILE" \
    -k "$VAULT_PASS"

  if [ $? -eq 0 ]; then
    chmod 600 "$ENV_FILE"
    echo -e "${GREEN}✓ Vault unlocked: tokens.env (chmod 600)${NC}"
    echo -e "${YELLOW}  ⚠  Remember to run 'lock' again after editing.${NC}"
  else
    echo -e "${RED}✗ Decryption failed — wrong password?${NC}"
    rm -f "$ENV_FILE"
    exit 1
  fi
}

cmd_load() {
  if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$VAULT_FILE" ]; then
      echo -e "${YELLOW}  Vault is locked. Unlocking to load...${NC}"
      cmd_unlock
    else
      echo -e "${RED}✗ No tokens.env or vault.enc found.${NC}"
      exit 1
    fi
  fi

  echo -e "${CYAN}  Loading secrets into shell...${NC}"
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
  echo -e "${GREEN}✓ Secrets loaded into current shell session.${NC}"
  echo ""
  echo -e "  ${BOLD}Available variables:${NC}"
  grep -v '^#' "$ENV_FILE" | grep -v '^$' | cut -d= -f1 | while read -r key; do
    echo -e "  ${CYAN}$key${NC} = ${!key:0:4}****"
  done
}

cmd_status() {
  banner
  echo -e "  ${BOLD}VAULT STATUS${NC}"
  echo ""

  if [ -f "$VAULT_FILE" ]; then
    SIZE=$(stat -c%s "$VAULT_FILE" 2>/dev/null || stat -f%z "$VAULT_FILE" 2>/dev/null)
    MODIFIED=$(stat -c%y "$VAULT_FILE" 2>/dev/null || stat -f%Sm "$VAULT_FILE" 2>/dev/null)
    echo -e "  ${GREEN}✓ vault.enc${NC}     EXISTS (${SIZE} bytes, modified: ${MODIFIED})"
  else
    echo -e "  ${RED}✗ vault.enc${NC}     NOT FOUND"
  fi

  if [ -f "$ENV_FILE" ]; then
    echo -e "  ${YELLOW}⚠  tokens.env${NC}   UNLOCKED (plaintext visible!)"
  else
    echo -e "  ${GREEN}✓ tokens.env${NC}    LOCKED (not present)"
  fi

  echo ""
}

cmd_edit() {
  cmd_unlock
  EDITOR="${EDITOR:-nano}"
  "$EDITOR" "$ENV_FILE"
  echo -e "${YELLOW}  Re-locking vault...${NC}"
  cmd_lock
}

cmd_docker_login() {
  if [ ! -f "$ENV_FILE" ]; then
    cmd_unlock
  fi
  source "$ENV_FILE"

  if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_TOKEN" ]; then
    echo -e "${RED}✗ DOCKER_USERNAME or DOCKER_TOKEN not set in tokens.env${NC}"
    exit 1
  fi

  echo -e "${CYAN}  Logging in to Docker Hub as: ${DOCKER_USERNAME}${NC}"
  echo "$DOCKER_TOKEN" | docker login --username "$DOCKER_USERNAME" --password-stdin

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker Hub login successful!${NC}"
  else
    echo -e "${RED}✗ Docker Hub login failed.${NC}"
    exit 1
  fi
}

# ── DISPATCH ──────────────────────────────────────────────
case "${1:-help}" in
  lock)    banner; cmd_lock ;;
  unlock)  banner; cmd_unlock ;;
  load)    banner; cmd_load ;;
  status)  cmd_status ;;
  edit)    banner; cmd_edit ;;
  docker)  banner; cmd_docker_login ;;
  help|*)  cmd_help ;;
esac
