# Tooti

English-learning app for Persian speakers, Duolingo-style. Domain: **tooti.academy**.

This repo is being built **one phase at a time** against two source-of-truth docs in
[`design/`](./design):

- [`design/tooti-handoff.md`](./design/tooti-handoff.md) — stack, architecture, and the **design tokens** (§5).
- [`design/tooti-roadmap.md`](./design/tooti-roadmap.md) — the phase-by-phase plan.
- [`design/styleguide.html`](./design/styleguide.html) — the **visual** source of truth (reference only; components are built in Phase 1, not copied from its markup).

> **Status: Phase 0 — Foundation.** A running, deployable Next.js skeleton wired to the design tokens. DB/Auth, components, screens, and content come in later phases.

## Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS v3** — utilities mapped to CSS variables in [`tailwind.config.ts`](./tailwind.config.ts)
- **Framer Motion** — variants derived from the motion tokens ([`lib/motion.ts`](./lib/motion.ts))
- **Postgres + Prisma**, **Auth.js** — _scaffolded as placeholders; wired in Phase 3_
- Deploy target: self-hosted Docker behind a TLS reverse proxy (Phase 7)

> Versions are pinned to a proven, stable line (Next 15 / React 18 / Tailwind 3) so CI stays green and `tailwind.config.ts` matches handoff §6 exactly. Upgrades (Next 16, Tailwind 4) can come later as their own change.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Then open:

- `/` — welcome / entry screen
- **`/tokens`** — design-token QA page (swatches of every color, space, radius, shadow, type and motion token)

Other scripts:

```bash
npm run lint         # ESLint (next/core-web-vitals + next/typescript + prettier)
npm run build        # production build (Next standalone output)
npm run format       # Prettier write
```

Copy [`.env.example`](./.env.example) to `.env.local` and fill in values when you reach Phase 3.

## Design tokens — the one rule

[`styles/globals.css`](./styles/globals.css) defines the `:root` tokens **exactly** as handoff §5 — it is the **single source of truth** for every value. Everything else references them and **hardcodes no raw hex / px / ms**:

- Tailwind utilities resolve to `var(--token)` via `tailwind.config.ts` (§6).
- Inline styles and the `/tokens` page reference `var(--token)` by name.
- Layout uses **logical CSS** (`text-start`, `ps-*`/`pe-*`, symmetric `px`/`py`) so the few Persian RTL islands stay cheap — no hardcoded left/right.

Fonts (Nunito / Vazirmatn / Lalezar-400) load via `next/font` ([`lib/fonts.ts`](./lib/fonts.ts)) and are exposed on `<html>`; the `--font-en` / `--font-body-fa` / `--font-display-fa` tokens point at them.

## Project structure

```
app/
  layout.tsx              # <html lang="en" dir="ltr">, fonts, tokens
  page.tsx                # welcome / entry
  tokens/page.tsx         # design-token QA page
  (app)/
    learn/                # lesson path        (Phase 2)
    lesson/[id]/          # exercise runner    (Phase 5)
    practice/ guide/ profile/
  api/health/route.ts     # health check
components/ui/            # component library  (Phase 1)
lib/                      # fonts, motion, i18n/fa (necessary-Persian dict), utils, db/auth placeholders
prisma/schema.prisma      # placeholder        (Phase 3)
styles/globals.css        # design tokens (§5)
design/                   # handoff / roadmap / styleguide (reference)
```

## Docker

[`Dockerfile`](./Dockerfile) is multi-stage: `deps` → `builder` (Next standalone) →
`runner` (minimal runtime), plus a `migrator` stage that runs `prisma migrate deploy`
and the seed without a Next build. [`docker-compose.yml`](./docker-compose.yml) wires
the app behind [Caddy](./Caddyfile) (automatic HTTPS) with Postgres and a one-shot
`migrate` gate. It reads secrets from `.env`, so copy the template first:

```bash
cp .env.production.example .env   # then fill in real values
docker compose up -d --build      # db → migrate → app → caddy
```

Only Caddy publishes host ports (80/443); `app` and `db` are internal. CI
([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) runs lint + build on every
push/PR.

## Deploy (tooti.academy)

Production runs the same Compose stack on your own server, with Caddy terminating
TLS via Let's Encrypt.

**Recommended — the installer.** On a fresh server, clone and run the interactive
script: it installs Docker if missing, generates the secrets, collects your domain
and the Google/Resend values, writes a `0600` `.env`, checks DNS, and brings the
stack up. It is safe to re-run (an existing `.env` is reused, so the DB password is
never regenerated).

```bash
git clone https://github.com/BoofKoor/tooti.git && cd tooti && ./scripts/install.sh
```

To do it by hand instead:

1. **DNS:** point an `A` record for `tooti.academy` at the server's IP and open
   inbound `80`/`443`.
2. **Env:** `cp .env.production.example .env` and fill in `POSTGRES_PASSWORD`,
   `AUTH_SECRET` (`openssl rand -base64 32`), `AUTH_URL=https://tooti.academy`, the
   Google OAuth pair, and the Resend SMTP `EMAIL_SERVER` / `EMAIL_FROM` (the
   from-address must be on a Resend-verified domain).
3. **Bring up:** `docker compose up -d --build`. First boot order is
   `db` → `migrate` (applies migrations + seeds Present Simple) → `app` → `caddy`,
   which fetches the cert once DNS resolves and the ports are reachable. Watch it
   with `docker compose logs -f caddy`, then open <https://tooti.academy>.
4. **Updates:** `git pull && docker compose up -d --build` — the `migrate` one-shot
   re-runs migrations + seed each deploy (idempotent).

### Behind a Cloudflare Origin Certificate

If the domain is proxied through Cloudflare (orange cloud), serve a long-lived
**Cloudflare Origin Certificate** at the origin instead of Let's Encrypt.
Cloudflare terminates public TLS at its edge and re-encrypts to this server.

```bash
git clone https://github.com/BoofKoor/tooti.git && cd tooti && ./scripts/install-cloudflare.sh
```

The script prompts, in order, for your **domain**, the **Origin Certificate**, and
the **Private Key** (each as a file path or pasted PEM). It validates that the key
matches the cert, writes them to `./certs` (`0600`, git-ignored), generates
`Caddyfile.cloudflare` with a `tls` directive (no ACME), and brings the stack up
with the Cloudflare overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml up -d --build
```

Mint the cert in Cloudflare under **SSL/TLS → Origin Server → Create Certificate**,
add a **Proxied** `A`/`AAAA` record for the domain → this server's IP, and set the
zone's SSL/TLS mode to **Full (strict)**. Re-running reuses the saved `.env` + certs.
For best hygiene, restrict inbound `80`/`443` to Cloudflare's published IP ranges.

The full account/DNS/OAuth runbook lives with the Phase 7 plan in [`design/`](./design).
