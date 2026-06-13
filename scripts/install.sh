#!/usr/bin/env bash
#
# Tooti one-shot installer — takes a fresh server from `git clone` to a live
# https://<domain>. Installs Docker if missing, collects the few real values
# interactively, generates the secrets itself, writes a 0600 .env, checks DNS,
# and brings the existing Compose stack up. Safe to re-run: an existing .env is
# reused by default (regenerating POSTGRES_PASSWORD against an existing
# tooti-db volume would lock out the database).
#
# Usage:  ./scripts/install.sh
#
# This script orchestrates; docker-compose.yml + the Dockerfile remain the
# source of truth for how the stack runs.

set -euo pipefail

# ── output helpers (color only on a TTY, honoring NO_COLOR) ──
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_BLUE=$'\033[1;34m'
  C_GREEN=$'\033[1;32m'
  C_YELLOW=$'\033[1;33m'
  C_RED=$'\033[1;31m'
else
  C_RESET="" C_BOLD="" C_BLUE="" C_GREEN="" C_YELLOW="" C_RED=""
fi

section() { printf '\n%s== %s ==%s\n' "$C_BLUE$C_BOLD" "$1" "$C_RESET"; }
info() { printf '%s\n' "  $1"; }
ok() { printf '%s✓%s %s\n' "$C_GREEN" "$C_RESET" "$1"; }
warn() { printf '%s!%s %s\n' "$C_YELLOW" "$C_RESET" "$1" >&2; }
err() { printf '%s✗%s %s\n' "$C_RED" "$C_RESET" "$1" >&2; }

on_err() {
  local rc=$? line="${1:-?}"
  printf '\n%s✗ install failed (exit %s) near line %s — your .env was preserved.%s\n' \
    "$C_RED" "$rc" "$line" "$C_RESET" >&2
}
trap 'on_err "$LINENO"' ERR

# ── prompt helpers ──
# All prompts have a default and tolerate Enter. With no TTY they take the
# default (never reading), so the script degrades to a defaults-only run.

# ask <prompt> <default> -> echoes the chosen value on stdout.
ask() {
  local prompt="$1" default="${2:-}" reply=""
  if [ ! -t 0 ]; then
    printf '%s' "$default"
    return 0
  fi
  read -r -p "$(printf '%s [%s]: ' "$prompt" "$default")" reply || reply=""
  printf '%s' "${reply:-$default}"
}

# ask_secret <prompt> -> echoes the typed value (input itself is never shown).
ask_secret() {
  local prompt="$1" reply=""
  if [ ! -t 0 ]; then
    printf ''
    return 0
  fi
  read -rs -p "$(printf '%s: ' "$prompt")" reply || reply=""
  printf '\n' >&2
  printf '%s' "$reply"
}

# confirm <prompt> <default y|n> -> returns 0 for yes, 1 for no.
confirm() {
  local prompt="$1" default="${2:-n}" hint="[y/N]" reply=""
  [ "$default" = "y" ] && hint="[Y/n]"
  if [ ! -t 0 ]; then
    [ "$default" = "y" ]
    return
  fi
  read -r -p "$(printf '%s %s ' "$prompt" "$hint")" reply || reply=""
  case "${reply:-$default}" in
    [yY]*) return 0 ;;
    *) return 1 ;;
  esac
}

# run a command as root via sudo when needed; hard-fail if neither is possible.
HAVE_SUDO=0
run_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif [ "$HAVE_SUDO" -eq 1 ]; then
    sudo "$@"
  else
    err "This step needs root, but neither root nor sudo is available: $*"
    exit 1
  fi
}

# docker may need sudo until a fresh `docker` group membership takes effect.
DOCKER_SUDO=0
compose() {
  if [ "$DOCKER_SUDO" -eq 1 ]; then
    run_root docker compose "$@"
  else
    docker compose "$@"
  fi
}

resolve_ip() {
  local host="$1" ip=""
  if command -v getent >/dev/null 2>&1; then
    ip="$(getent hosts "$host" 2>/dev/null | awk '{print $1; exit}')" || true
  fi
  if [ -z "$ip" ] && command -v dig >/dev/null 2>&1; then
    ip="$(dig +short "$host" 2>/dev/null | awk '/^[0-9.]+$/{print; exit}')" || true
  fi
  printf '%s' "$ip"
}

# ── collected config (initialized for `set -u`) ──
DOMAIN=""
AUTH_URL=""
POSTGRES_PASSWORD=""
AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
EMAIL_SERVER=""
EMAIL_FROM=""

# ── 1.1 preflight ──
preflight() {
  section "Preflight"
  if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
      HAVE_SUDO=1
    else
      HAVE_SUDO=0
      warn "Not root and sudo is not installed; Docker/firewall install steps will be unavailable."
    fi
  fi
  if [ ! -f docker-compose.yml ] || [ ! -f Caddyfile ]; then
    err "Run this from the repo root (docker-compose.yml and Caddyfile must exist)."
    exit 1
  fi
  if ! command -v openssl >/dev/null 2>&1; then
    err "openssl is required to generate secrets. Install it and re-run."
    exit 1
  fi
  ok "In the repo root."
}

# ── 1.2 Docker + Compose ──
ensure_docker() {
  section "Docker"
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    ok "Docker and Compose v2 present."
  else
    if confirm "Docker / Compose not found. Install via Docker's official script?" y; then
      info "Installing Docker…"
      curl -fsSL https://get.docker.com | run_root sh
      run_root usermod -aG docker "${USER:-$(id -un)}" 2>/dev/null || true
      warn "Added you to the 'docker' group — that takes effect after re-login."
    else
      err "Docker is required. Install it and re-run."
      exit 1
    fi
  fi
  # Confirm the daemon is reachable; fall back to sudo for this run if needed.
  if docker info >/dev/null 2>&1; then
    DOCKER_SUDO=0
  elif [ "$HAVE_SUDO" -eq 1 ] && sudo docker info >/dev/null 2>&1; then
    DOCKER_SUDO=1
    warn "Using 'sudo docker' for this run (group change needs re-login)."
  else
    err "Docker daemon is not reachable. Start it (e.g. 'sudo systemctl start docker') and re-run."
    exit 1
  fi
  ok "Docker daemon reachable."
}

# ── 1.4 collect values + write .env ──
collect_and_write_env() {
  section "Configuration"
  DOMAIN="$(ask 'Domain' 'tooti.academy')"
  AUTH_URL="https://${DOMAIN}"

  # Secrets are generated, never asked. Strip URL-unsafe chars from the DB
  # password so it is safe inside DATABASE_URL.
  AUTH_SECRET="$(openssl rand -base64 32)"
  POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=')"
  ok "Generated AUTH_SECRET and POSTGRES_PASSWORD."

  # Resend (email magic-link). Key is read silently; never echoed.
  local resend_key
  resend_key="$(ask_secret 'Resend API key (re_…), or Enter to skip email')"
  if [ -n "$resend_key" ]; then
    EMAIL_SERVER="smtps://resend:${resend_key}@smtp.resend.com:465"
  else
    EMAIL_SERVER=""
    warn "No Resend key — magic-link emails will only be logged in the app container, not sent."
  fi
  EMAIL_FROM="$(ask 'Email From' "Tooti <login@${DOMAIN}>")"

  # Google OAuth (optional — empty is fine; magic-link still works).
  info "For Google sign-in, the redirect URI must be: https://${DOMAIN}/api/auth/callback/google"
  info "and your Google account must be a Test user until the consent screen is published."
  AUTH_GOOGLE_ID="$(ask 'Google client ID (Enter to skip)' '')"
  if [ -n "$AUTH_GOOGLE_ID" ]; then
    AUTH_GOOGLE_SECRET="$(ask_secret 'Google client secret')"
  else
    AUTH_GOOGLE_SECRET=""
    warn "No Google credentials — only magic-link sign-in will be available."
  fi

  # Write .env at 0600 (umask + explicit chmod), mirroring .env.production.example.
  umask 077
  cat >.env <<EOF
# Generated by scripts/install.sh — do NOT commit. Secrets are hidden from the terminal.
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
AUTH_SECRET="${AUTH_SECRET}"
AUTH_URL="${AUTH_URL}"
AUTH_GOOGLE_ID="${AUTH_GOOGLE_ID}"
AUTH_GOOGLE_SECRET="${AUTH_GOOGLE_SECRET}"
EMAIL_SERVER="${EMAIL_SERVER}"
EMAIL_FROM="${EMAIL_FROM}"
EOF
  chmod 600 .env
  ok "Wrote .env (secrets hidden)."
}

# ── 1.3 .env handling: reuse by default, else back up and re-collect ──
# Sets REUSED=1 when an existing .env is kept (a re-run / update goes straight
# to bring-up; DNS + firewall were already handled on the first install).
REUSED=0
handle_env() {
  section "Environment file"
  if [ -f .env ]; then
    info "An existing .env was found."
    if confirm "Reuse existing .env?" y; then
      ok "Reusing existing .env (secrets unchanged)."
      REUSED=1
      return 0
    fi
    local backup
    backup=".env.bak.$(date +%Y%m%d%H%M%S)"
    mv .env "$backup"
    warn "Backed up previous .env to ${backup}."
    collect_and_write_env
  else
    collect_and_write_env
  fi
  return 0
}

# ── 1.5 DNS + firewall ──
dns_check() {
  section "DNS"
  local server_ip domain_ip
  server_ip="$(curl -fsS -m 6 https://api.ipify.org 2>/dev/null || true)"
  domain_ip="$(resolve_ip "$DOMAIN")"
  if [ -n "$server_ip" ]; then info "This server's public IP: ${server_ip}"; else warn "Could not determine this server's public IP."; fi
  if [ -n "$domain_ip" ]; then info "${DOMAIN} resolves to: ${domain_ip}"; else warn "${DOMAIN} does not resolve yet."; fi

  if [ -n "$server_ip" ] && [ "$server_ip" = "$domain_ip" ]; then
    ok "DNS points at this server."
    return 0
  fi
  warn "Caddy cannot obtain a TLS certificate until ${DOMAIN} points to ${server_ip:-this server} (and 80/443 are open)."
  if confirm "Continue anyway?" n; then
    warn "Continuing without confirmed DNS — TLS will fail until DNS propagates."
    return 0
  fi
  info "Stopping here. Point DNS at this server, then re-run ./scripts/install.sh (it reuses your .env)."
  exit 0
}

firewall_check() {
  section "Firewall"
  local status=""
  if command -v ufw >/dev/null 2>&1; then
    if [ "$(id -u)" -eq 0 ]; then
      status="$(ufw status 2>/dev/null || true)"
    elif [ "$HAVE_SUDO" -eq 1 ]; then
      status="$(sudo ufw status 2>/dev/null || true)"
    fi
  fi
  if printf '%s' "$status" | grep -qi 'Status: active'; then
    if confirm "ufw is active. Open ports 80 and 443?" y; then
      run_root ufw allow 80,443/tcp
      ok "Opened 80,443/tcp."
    else
      warn "Leaving the firewall unchanged — 80/443 must be reachable for TLS."
    fi
  else
    info "Ensure inbound 80 and 443 are open (plus your SSH port)."
  fi
  return 0
}

# ── 1.6 bring-up + 1.7 health check ──
bring_up() {
  section "Build & start"
  info "Running: docker compose up -d --build (db → migrate → app → caddy)…"
  compose up -d --build
  ok "Stack is up."
}

health_check() {
  section "Health check"
  local url="https://${DOMAIN}/api/health" i
  printf '  waiting for %s' "$DOMAIN"
  for ((i = 0; i < 30; i++)); do
    if curl -fsS -m 4 -o /dev/null "$url" 2>/dev/null; then
      printf '\n'
      ok "Live: https://${DOMAIN}"
      return 0
    fi
    printf '.'
    sleep 2
  done
  printf '\n'
  warn "No response from ${url} yet — TLS/DNS may still be coming up."
  info "Watch the certificate being issued: docker compose logs -f caddy"
  return 0
}

finish() {
  section "Done"
  ok "Tooti is deployed."
  info "URL:      https://${DOMAIN}"
  info "App logs: docker compose logs -f app"
  info "Caddy:    docker compose logs -f caddy"
  info "Update:   git pull && ./scripts/install.sh   (reuse .env → rebuild)"
  info "Backups:  the 'tooti-db' volume holds all user data — schedule a pg_dump before you have real users."
}

main() {
  printf '%s%sTooti installer%s\n' "$C_BOLD" "$C_BLUE" "$C_RESET"
  preflight
  ensure_docker
  handle_env
  # A reused .env means a re-run/update — DNS + firewall were settled on the
  # first install, so go straight to bring-up (§1.3).
  if [ "$REUSED" -eq 0 ]; then
    dns_check
    firewall_check
  fi
  bring_up
  health_check
  finish
}

main "$@"
