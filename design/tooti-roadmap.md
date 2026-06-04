# Tooti — Build Roadmap (detailed)

How to read this: every phase runs the same loop —
**I (chat) write the spec & review → Claude Code builds on a branch → you push & bring it back → I review against the checklist → fix → ✅ → next phase.**
We never start a phase before the previous one is ✅. Each phase = one (or a few) PRs.

Legend: 🧠 = I do it · 🤖 = Claude Code does it · 🧑 = you do it.

---

## Phase 0 — Foundation & repo
**Goal:** a running, deployable Next.js skeleton wired to the design tokens.

- 🧠 Done: the handoff doc (tokens + architecture) and the Phase-0 task.
- 🧑 Commit `styleguide.html` and `tooti-handoff.md` into `/design/`.
- 🧑 Give Claude Code the **PHASE 0 task** (handoff §8). Work on a branch → PR.
- 🤖 Builds: Next.js App Router + TS + ESLint/Prettier · `globals.css` with the `:root` tokens · `tailwind.config.ts` theme.extend · `next/font` (Nunito / Vazirmatn / Lalezar-400-only) · root layout `lang="en" dir="ltr"` · folder structure (`learn`, `lesson/[id]`, `practice`, `guide`, `profile` placeholders) · a `/tokens` dev page (swatches of every token) · `Dockerfile` + `docker-compose` (app+postgres) + `.env.example` + GitHub Action (lint+build).

**Done looks like:** dev server runs · `/tokens` shows every color/space/radius/shadow correctly · fonts load · Docker builds · CI green.
**🧠 Review checklist:** tokens match the system exactly · `lang="en" dir="ltr"` · logical CSS props only (no hardcoded left/right or raw hex/px) · structure correct.
**Unblocks:** everything.

---

## Phase 1 — Component library
**Goal:** the reusable UI kit from the style guide, as typed React components driven by tokens.

- 🧠 I deliver the component spec in **3 batches** (props, variants, states, exact tokens, behavior — pulled from `styleguide.html`):
  - **A · primitives:** Button (variants primary/confirm/secondary/disabled; states rest/hover/pressed/**loading=3 dots**; the press-edge bottom lip), Card, Typography, Badge (streak/xp/unit).
  - **B · feedback/system:** Toast (4 types), Skeleton (+shimmer), EmptyState, ErrorState, Spinner/loaders.
  - **C · brand/nav:** **TabBar** (notched floating-active, **Learn · Practice · Guide · Profile**), Medal (the 8 + 4 states), Mascot (4 states).
- 🤖 Builds each component in `/components/ui` using tokens + a `/components` showcase page.
- 🧑 Give each batch to Claude Code; push.

**Done looks like:** the showcase page matches the style guide; components typed & reusable.
**🧠 Review checklist:** visual parity with styleguide · sane prop API · token-only (no hardcoded) · all states/interactions · focus rings (a11y).
**Unblocks:** screens.

---

## Phase 2 — Screens (UI with mock data)
**Goal:** a clickable, real-looking app shell — no backend yet.

- 🧠 I deliver per-screen specs (layout, components, states, navigation) from the styleguide:
  Welcome/entry · **Learn path** (Tenses nodes active + future topics as locked "soon" nodes) · Lesson/exercise runner · Practice · Guide (grammar reference) · Profile. Plus tab-bar wiring + routing.
- 🤖 Builds the routes/pages with **mock data**, tab-bar navigation, mobile-first responsive layout, and the empty/error/loading states wired.
- 🧑 Push; click through it.

**Done looks like:** you can navigate the whole app; every screen looks right; the exercise flow is clickable (mock).
**🧠 Review checklist:** navigation/tab-bar · screen parity · empty/error/loading wired · mobile layout.
**Unblocks:** data.

---

## Phase 3 — Data & auth
**Goal:** persistence + accounts.

- 🧑 **Decision needed (quick):** auth method — email magic-link, Google, or both?
- 🧠 I deliver the Prisma schema spec (`User`, `Progress`, `Unit`/`Lesson`/`Exercise` + type enums, `LessonCompletion`, `Medal`/`Achievement`; relations) + Auth.js config spec (provider, session, protected `(app)` routes).
- 🤖 Builds: schema + migrations · Postgres via docker-compose · Prisma client · Auth.js (sign up/in/out, session) · route protection · a seed script with a few Tenses lessons.
- 🧑 Run migrations; create a test account.

**Done looks like:** sign up/in works; data persists; seeded lessons show.
**🧠 Review checklist:** schema sanity · auth flow · route protection · seed correctness.
**Unblocks:** logic.

---

## Phase 4 — Gamification logic
**Goal:** XP, streak, daily goal, medal unlocks (no league).

- 🧠 I deliver the rules spec: XP per exercise/lesson · streak rules (day boundary + timezone, what breaks it) · daily-goal options · unlock conditions for the 8 medals · when toasts/celebrations fire.
- 🤖 Builds server actions/API: award XP, update streak, daily goal, evaluate & unlock medals; wire to Profile + toasts.

**Done looks like:** finishing a lesson awards XP; streak increments daily; medals unlock at thresholds; Profile reflects all of it.
**🧠 Review checklist:** edge cases (missed day breaks streak, no double-counting, timezone) · medal conditions exact.
**Unblocks:** real lessons.

---

## Phase 5 — Lesson engine + content + necessary Persian
**Goal:** the real Tenses curriculum, playable end-to-end, with Persian only where it must be.

- 🧠 I deliver: (a) exercise-engine spec (the exercise types from the design — MCQ, fill-blank, word-bank/arrange, translate, listen; checking logic; hearts/mistakes; lesson-session flow); (b) the **Tenses curriculum outline** (which tenses, lesson breakdown, sample items — I help draft); (c) the **necessary-Persian dictionary** (instructions, error explanations, Guide text) precisely scoped here.
- 🤖 Builds: the exercise runner consuming lesson data · checking/feedback · the Guide content pages · Persian strings wired from `/lib/i18n/fa.ts`.
- 🧑 **Your language expertise matters most here** — review/approve the curriculum + every Persian string.

**Done looks like:** a learner completes real Tenses lessons, gets correct/wrong feedback with Persian explanations, and can browse the Guide.
**🧠 Review checklist:** pedagogy/flow · content correctness · Persian placement (only where necessary) · feedback quality.
**Unblocks:** polish.

---

## Phase 6 — Motion + mascot + celebrations
**Goal:** the app feels alive.

- 🧠 I deliver the Framer Motion mapping from the motion tokens (button press, tab spring, toast slide, stagger fade-up, correct-answer pop, **lesson-complete celebration**, **medal-unlock**) + lead the **bespoke mascot illustration pass** (the poses we parked — SVG, or a proper illustration tool).
- 🤖 Builds the Framer implementations + celebration sequences (confetti, XP count-up, mascot bounce) + **prefers-reduced-motion** support.

**Done looks like:** interactions & celebrations match the motion spec; reduced-motion respected.
**🧠 Review checklist:** timing/feel vs tokens · celebration choreography · reduced-motion.
**Unblocks:** launch.

---

## Phase 7 — Deploy
**Goal:** live on `tooti.academy`.

- 🧑 **You provide:** server access · DNS `tooti.academy` → server · production secrets.
- 🧠 I deliver the deploy spec (prod Docker, reverse-proxy TLS, env/secrets, DB backup, basic uptime/error monitoring).
- 🤖 Builds/executes: production Docker · CI deploy workflow · Caddy/nginx + TLS · migrations on deploy.

**Done looks like:** `tooti.academy` serves the app over HTTPS; sign-in works; a lesson completes in production.
**🧠 Review checklist:** prod smoke test · TLS · env/secrets · DB persistence · error monitoring.
**→ Soft launch.**

---

## Decisions you'll need to make along the way
- **Phase 3:** auth method (email magic-link / Google / both).
- **Phase 5:** which exact Tenses to ship first, and final Persian wording.
- **Phase 7:** server specifics (where Postgres lives, backups), analytics yes/no.

## The one rule that keeps quality high
Give Claude Code **concrete, scoped specs from me — one phase at a time — and review before moving on.** That single discipline is what made the design phase work, and it's what will make the build work.
