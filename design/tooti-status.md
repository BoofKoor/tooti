# Tooti — Project Status & Continuation Brief
_Paste this into a new chat to resume. Also keep it in the repo (`design/tooti-status.md`)._

## What this is
**Tooti (طوطی)** — a Duolingo-style app teaching English to Persian speakers.
- Repo (public): `https://github.com/BoofKoor/tooti` · Domain: `tooti.academy` · Solo dev (Mehdi).
- **Source of truth is the repo.** Read first: `design/styleguide.html` (design system), `design/tooti-handoff.md` (stack, tokens, architecture, English-first policy), `design/tooti-roadmap.md` (8-phase plan).

## How we work (the loop)
- Conversation in **Persian**; deliverables are **ready-to-paste specs** for **Claude Code (web version)**.
- Per batch: **Claude (chat) writes a concrete spec from `design/styleguide.html` → Claude Code builds on a branch OFF `main` → user pushes & opens a PR → Claude (chat) INDEPENDENTLY audits by cloning the branch via bash (`git clone` the public repo) → reports a verdict → user merges → next.** Never commit to `main` directly; user merges after review. Branch each batch **off `main`**.
- **Review depth scales with risk** (calibrated): pure-composition batches → code audit only (diff clean, composition, token discipline); visual / SVG / novel-layout batches → also RENDER headless (playwright: `npm ci`+`npm run build`+`next start`, screenshot the route) because "build green" doesn't prove visual fidelity. (When fetching, `git fetch origin main` fresh — local `origin/main` can be stale and make diffs look wrong.)
- **Token discipline:** zero raw hex/px/ms in `.tsx` (literal class maps); styles in `@layer components` + component tokens in `styles/globals.css`; **SVG artwork is exempt**. For SVG components, namespace gradient/filter ids per instance with `useId()`.
- **English-first (LTR)**; Persian only at comprehension-critical islands via the `fa` Text variant (lesson instructions, error/grammar explanations, onboarding/welcome). **Logical CSS only**.
- **Tab bar = Learn · Practice · Guide · Profile** (no League/Shop). **MVP content = grammar → Tenses**; future topics = locked "soon" nodes inside the Learn path. Icons = `@phosphor-icons/react`.

## Status — all MERGED to `main`
- **Phase 0 — Foundation** ✅ (PR #1): Next 15 / React 18 / TS / Tailwind v3, tokens in `globals.css` + `tailwind.config.ts`, fonts (Nunito / Vazirmatn / Lalezar-400), `lang=en dir=ltr` shell, `/tokens` page, Docker + CI.
- **Phase 1 — Component library** ✅: A primitives (Button/Card/Text/Badge, XP=gold) PR#2 · B feedback (Toast×4 / Spinner+PageLoader / Skeleton / StateView=Empty/Error) PR#3 · C1 TabBar(notched) + Mascot(4 poses) + Phosphor PR#4 · C2 Medal(8 × 4 states) PR#5. Showcase: `/components`.
- **Phase 2 — Screens (mock)** ✅ COMPLETE: 2A shell + router-wired TabBar + Welcome PR#6 · 2B Learn path (trail/nodes/states + tooti-on-node + "soon" section) · 2C Lesson runner (lesson-bar/hearts/progress + MCQ + Check→fb-banner correct/wrong + Persian explanation + complete) · 2D Profile (hero + stats + daily-goal + this-week + Achievements using the Medal component) · 2E Guide (index + detail, EN+FA) + Practice (review landing). All routes real & navigable.

## NEXT UP — Phase 3 · Data + Auth
First step of the build's "backend" half. Per `design/tooti-roadmap.md` Phase 3:
- **Decision the user must make first:** auth method — email magic-link, Google OAuth, or both.
- Claude writes the spec: a Prisma schema (`User`, `Progress` [xp, streak, lastActiveDate, dailyGoal], `Unit`/`Lesson`/`Exercise` + type enums, `LessonCompletion`, `Medal`/`Achievement`; relations), + Auth.js config (provider, session, protect the `(app)` routes), + Postgres via the existing docker-compose, + a seed script with a few Tenses lessons.
- Claude Code builds on `screens`→`data-auth` branch off main; user pushes/PRs; Claude audits (schema sanity, auth flow, route protection, seed).
- "Done looks like": sign up/in works, data persists, seeded lessons show. Then wire the mock screens to real data in later batches.

## Remaining roadmap (design/tooti-roadmap.md)
Phase 3 Data+Auth · 4 Gamification (XP/streak/daily-goal/medal unlocks) · 5 Lesson engine + real Tenses content + necessary Persian (decision: which tenses + wording) · 6 Motion + bespoke mascot illustration pass + celebrations + **deferred polish** · 7 Deploy to tooti.academy (decision: server).

## Deferred polish (do in Phase 6)
- Profile → Achievements row: medal **labels are cramped/overlapping** when 5 medals sit in one row (use horizontal scroll, fewer per row, or smaller/truncated labels).
- Button `secondary` variant: hover edge stays `border-strong` vs the styleguide's slightly darker `text-3` (negligible).

## To resume in a new chat
Paste this brief. Claude should: `git clone` the public repo via bash to re-orient, skim `design/` docs, then continue from **NEXT UP (Phase 3)** using the loop. First ask the user the auth-method decision, then write the Phase-3 spec.
