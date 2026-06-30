#!/usr/bin/env bash
#
# Tooti installer for a Cloudflare Origin Certificate.
#
# Like scripts/install.sh, but instead of letting Caddy obtain a public Let's
# Encrypt certificate it serves the long-lived Cloudflare Origin cert you mint in
# the dashboard (SSL/TLS → Origin Server → Create Certificate). Cloudflare
# terminates public TLS at its edge and re-encrypts to this origin. Set the
# zone's SSL/TLS mode to **Full (strict)**.
#
# It prompts, in order, for:
#   1. your domain,
#   2. the Origin Certificate (file path or pasted PEM),
#   3. the Private Key (file path or pasted PEM),
# then writes them under ./certs, generates a matching ./Caddyfile.cloudflare,
# collects/keeps .env (secrets generated, never asked), and brings the stack up
# with the Cloudflare overlay. Safe to re-run: an existing .env / cert pair is
# reused by default.
#
# Usage:  ./scripts/install-cloudflare.sh

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
  printf '\n%s✗ install failed (exit %s) near line %s — your .env and certs were preserved.%s\n' \
    "$C_RED" "$rc" "$line" "$C_RESET" >&2
}
trap 'on_err "$LINENO"' ERR

# ── prompt helpers ──
ask() {
  local prompt="$1" default="${2:-}" reply=""
  if [ ! -t 0 ]; then
    printf '%s' "$default"
    return 0
  fi
  read -r -p "$(printf '%s [%s]: ' "$prompt" "$default")" reply || reply=""
  printf '%s' "${reply:-$default}"
}

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

# Read a PEM block pasted on stdin and echo it. Stops automatically right after
# the block's own "-----END …-----" line, so there's no sentinel to remember —
# you just paste the cert/key. (A bare "END" line also stops it, as a fallback.)
read_pem_paste() {
  local line block=""
  while IFS= read -r line; do
    block+="$line"$'\n'
    case "$line" in
      *-----END*-----* | END) break ;;
    esac
  done
  printf '%s' "$block"
}

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

DOCKER_SUDO=0
compose() {
  # Always layer the Cloudflare overlay on top of the base compose file.
  if [ "$DOCKER_SUDO" -eq 1 ]; then
    run_root docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml "$@"
  else
    docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml "$@"
  fi
}

# ── collected config ──
DOMAIN=""
AUTH_URL=""
POSTGRES_PASSWORD=""
AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
EMAIL_SERVER=""
EMAIL_FROM=""

CERT_DIR="certs"
CERT_FILE="${CERT_DIR}/origin.pem"
KEY_FILE="${CERT_DIR}/origin.key"

# ── preflight ──
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
  if [ ! -f docker-compose.yml ] || [ ! -f docker-compose.cloudflare.yml ]; then
    err "Run this from the repo root (docker-compose.yml and docker-compose.cloudflare.yml must exist)."
    exit 1
  fi
  if ! command -v openssl >/dev/null 2>&1; then
    err "openssl is required (to generate secrets and validate the cert). Install it and re-run."
    exit 1
  fi
  ok "In the repo root."
}

# ── Docker + Compose ──
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
  # The Cloudflare overlay uses the `!override` YAML tag (Compose 2.24.4+).
  local cv
  cv="$(docker compose version --short 2>/dev/null || echo 0)"
  info "Docker Compose version: ${cv}"
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

# ── 1: domain + .env (secrets generated, never asked) ──
collect_and_write_env() {
  section "Configuration"
  DOMAIN="$(ask 'Domain (the hostname on your Origin Certificate)' 'tooti.academy')"
  AUTH_URL="https://${DOMAIN}"

  AUTH_SECRET="$(openssl rand -base64 32)"
  POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=')"
  ok "Generated AUTH_SECRET and POSTGRES_PASSWORD."

  local resend_key
  resend_key="$(ask_secret 'Resend API key (re_…), or Enter to skip email')"
  if [ -n "$resend_key" ]; then
    EMAIL_SERVER="smtps://resend:${resend_key}@smtp.resend.com:465"
  else
    EMAIL_SERVER=""
    warn "No Resend key — magic-link emails will only be logged in the app container, not sent."
  fi
  EMAIL_FROM="$(ask 'Email From' "Tooti <login@${DOMAIN}>")"

  info "For Google sign-in, the redirect URI must be: https://${DOMAIN}/api/auth/callback/google"
  AUTH_GOOGLE_ID="$(ask 'Google client ID (Enter to skip)' '')"
  if [ -n "$AUTH_GOOGLE_ID" ]; then
    AUTH_GOOGLE_SECRET="$(ask_secret 'Google client secret')"
  else
    AUTH_GOOGLE_SECRET=""
    warn "No Google credentials — only magic-link sign-in will be available."
  fi

  umask 077
  cat >.env <<EOF
# Generated by scripts/install-cloudflare.sh — do NOT commit. Secrets are hidden from the terminal.
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

REUSED=0
handle_env() {
  section "Environment file"
  if [ -f .env ]; then
    info "An existing .env was found."
    if confirm "Reuse existing .env?" y; then
      ok "Reusing existing .env (secrets unchanged)."
      # Recover DOMAIN from the kept .env so later steps still have it.
      DOMAIN="$(sed -n 's#^AUTH_URL="https\{0,1\}://\([^"]*\)".*#\1#p' .env | head -n1)"
      [ -z "$DOMAIN" ] && DOMAIN="$(ask 'Domain' 'tooti.academy')"
      AUTH_URL="https://${DOMAIN}"
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

# ── 2 + 3: Origin Certificate and Private Key ──
# Collect one PEM (cert or key) into $2. Default is to paste it right here; the
# paste auto-stops at the block's own -----END …----- line. You can also point
# at a file (default path ./certs/origin.*). Robust to mis-input: a bad path
# re-prompts, and a PEM pasted straight at the menu is detected and captured —
# nothing is ever treated as a shell command, so a mis-paste can't crash the run.
collect_pem() {
  local label="$1" dest="$2" answer path
  while true; do
    answer="$(ask "${label} — [P]aste it here now, or give a [f]ile path?" 'P')"
    case "$answer" in
      [Pp] | [Pp]aste | paste | '')
        info "Paste the ${label} now (include the BEGIN and END lines):"
        read_pem_paste >"$dest"
        break
        ;;
      [Ff] | [Ff]ile | file | path)
        path="$(ask "Path to the ${label} file" "$dest")"
        if [ -f "$path" ]; then
          [ "$path" = "$dest" ] || cp "$path" "$dest"
          break
        fi
        warn "No such file: $path — let's try again."
        ;;
      *-----BEGIN*)
        # Someone pasted the PEM straight at the menu: keep this first line and
        # read the rest of the block from the same paste.
        {
          printf '%s\n' "$answer"
          read_pem_paste
        } >"$dest"
        break
        ;;
      *)
        warn "Please answer P (paste) or f (file path)."
        ;;
    esac
  done
  chmod 600 "$dest"
}

collect_cert() {
  section "Cloudflare Origin Certificate"

  if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    if confirm "Existing cert + key found in ./${CERT_DIR}. Reuse them?" y; then
      ok "Reusing existing certificate and key."
      validate_cert
      return 0
    fi
  fi

  info "In Cloudflare: SSL/TLS → Origin Server → Create Certificate (PEM)."
  mkdir -p "$CERT_DIR"
  chmod 700 "$CERT_DIR"
  umask 077

  collect_pem "Origin Certificate" "$CERT_FILE"
  collect_pem "Private Key" "$KEY_FILE"

  ok "Saved certificate and key to ./${CERT_DIR} (0600)."
  validate_cert
}

# Sanity-check the PEMs: parseable, key matches cert, and the domain is covered.
validate_cert() {
  if ! openssl x509 -in "$CERT_FILE" -noout >/dev/null 2>&1; then
    err "${CERT_FILE} is not a valid PEM certificate."
    exit 1
  fi
  local key_ok=0
  if openssl pkey -in "$KEY_FILE" -noout >/dev/null 2>&1 ||
    openssl rsa -in "$KEY_FILE" -noout >/dev/null 2>&1 ||
    openssl ec -in "$KEY_FILE" -noout >/dev/null 2>&1; then
    key_ok=1
  fi
  if [ "$key_ok" -ne 1 ]; then
    err "${KEY_FILE} is not a valid PEM private key."
    exit 1
  fi

  # Cert/key must share the same public key (compare SHA-256 of the SPKI).
  local cert_spki key_spki
  cert_spki="$(openssl x509 -in "$CERT_FILE" -noout -pubkey 2>/dev/null | openssl pkey -pubin -outform DER 2>/dev/null | openssl dgst -sha256 2>/dev/null | awk '{print $NF}')"
  key_spki="$(openssl pkey -in "$KEY_FILE" -pubout -outform DER 2>/dev/null | openssl dgst -sha256 2>/dev/null | awk '{print $NF}')"
  if [ -n "$cert_spki" ] && [ -n "$key_spki" ] && [ "$cert_spki" != "$key_spki" ]; then
    err "The private key does not match the certificate."
    exit 1
  fi
  ok "Certificate and key are valid and match."

  # Informational: does the cert actually cover this domain?
  local sans
  sans="$(openssl x509 -in "$CERT_FILE" -noout -ext subjectAltName 2>/dev/null | tr ',' '\n' | sed -n 's/.*DNS://p' | tr -d ' ')"
  if [ -n "$sans" ]; then
    if printf '%s\n' "$sans" | grep -qiE "^\*?\.?${DOMAIN#*.}$|^${DOMAIN}$|^\*\.${DOMAIN#*.}$"; then
      ok "Certificate covers ${DOMAIN}."
    else
      warn "Certificate SANs (${sans//$'\n'/, }) may not cover ${DOMAIN} — Cloudflare will reject it in Full (strict) mode if it doesn't."
    fi
  fi
}

# ── write the Cloudflare Caddyfile (serves the origin cert, no ACME) ──
write_caddyfile() {
  section "Caddy config"
  cat >Caddyfile.cloudflare <<EOF
# Generated by scripts/install-cloudflare.sh — serves the Cloudflare Origin
# Certificate (no Let's Encrypt / ACME). Cloudflare terminates public TLS and
# re-encrypts to this origin; keep the zone on SSL/TLS mode "Full (strict)".
${DOMAIN} {
	encode zstd gzip
	tls /etc/caddy/certs/origin.pem /etc/caddy/certs/origin.key
	reverse_proxy app:3000
}
EOF
  ok "Wrote Caddyfile.cloudflare for ${DOMAIN}."
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
      warn "Leaving the firewall unchanged — Cloudflare must reach 443 on this origin."
    fi
  else
    info "Ensure inbound 443 (and 80) are reachable from Cloudflare, plus your SSH port."
  fi
  info "Tip: in production, restrict 80/443 to Cloudflare's published IP ranges."
  return 0
}

bring_up() {
  section "Build & start"
  info "Running: docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml up -d --build"
  compose up -d --build
  ok "Stack is up."
}

# Health-check the origin directly (bypassing Cloudflare): resolve the domain to
# localhost and skip public-CA verification, since an Origin cert is only trusted
# by Cloudflare's edge, not the system trust store.
health_check() {
  section "Health check (origin)"
  local i
  printf '  waiting for the origin to answer on 443'
  for ((i = 0; i < 30; i++)); do
    if curl -fsS -k -m 4 --resolve "${DOMAIN}:443:127.0.0.1" \
      -o /dev/null "https://${DOMAIN}/api/health" 2>/dev/null; then
      printf '\n'
      ok "Origin is serving https for ${DOMAIN}."
      return 0
    fi
    printf '.'
    sleep 2
  done
  printf '\n'
  warn "Origin did not answer yet — check: docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml logs -f caddy app"
  return 0
}

finish() {
  section "Done"
  ok "Tooti is deployed behind your Cloudflare Origin Certificate."
  info "Public URL:   https://${DOMAIN}  (proxied through Cloudflare — orange cloud ON)"
  info "Cloudflare:   set SSL/TLS encryption mode to 'Full (strict)'."
  info "DNS:          an A/AAAA record for ${DOMAIN} → this server's IP, Proxied."
  info "App logs:     docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml logs -f app"
  info "Caddy logs:   docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml logs -f caddy"
  info "Update:       git pull && ./scripts/install-cloudflare.sh   (reuses .env + certs → rebuild)"
  info "Backups:      the 'tooti-db' volume holds all user data — schedule a pg_dump before real users."
}

main() {
  printf '%s%sTooti installer — Cloudflare Origin Certificate%s\n' "$C_BOLD" "$C_BLUE" "$C_RESET"
  preflight
  ensure_docker
  handle_env
  collect_cert
  write_caddyfile
  if [ "$REUSED" -eq 0 ]; then
    firewall_check
  fi
  bring_up
  health_check
  finish
}

main "$@"
