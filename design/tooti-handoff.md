# Tooti — Build Handoff (source of truth for Claude Code)

English-learning app for Persian speakers. Duolingo-style. Domain: **tooti.academy**.
Visual source of truth: **`/design/styleguide.html`** (commit it to the repo, read it for any component/screen).

---

## 1. Stack (locked)

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** (tokens below are the single source of truth — do NOT invent values)
- **Framer Motion** (motion tokens below)
- **Postgres + Prisma**
- **Auth.js**
- Deploy target: **self-hosted server** (Docker), reverse proxy (Caddy or nginx) with TLS for `tooti.academy`.

## 2. Language policy — English-only app

The app UI is **English, LTR**. Persian appears **only** at comprehension-critical points:
lesson instructions / grammar explanations / hints, error-feedback explanations, onboarding/welcome,
placement test, paywall / account / billing / legal. Everything else (gamification chrome, buttons,
profile, league, shop, medals) is English. The English being *taught* is always English.

**Build implication:** LTR by default. Use **logical CSS properties** everywhere
(`margin-inline`, `padding-inline`, `inset-inline`, `text-align: start/end`, `border-start-*`)
so the few Persian islands (and any future full RTL) stay cheap. Keep Persian strings in a small
typed dictionary (`/lib/i18n/fa.ts`) rather than scattering them.

## 3. Architecture

```
/app
  layout.tsx                 # html lang="en" dir="ltr"; fonts; <body>
  page.tsx                   # welcome / entry
  (app)/
    learn/page.tsx           # lesson path (Tenses active; future topics = locked "soon" nodes)
    lesson/[id]/page.tsx     # exercise runner
    practice/page.tsx        # review / strengthen learned tenses
    guide/page.tsx           # grammar reference (browse tenses anytime)
    profile/page.tsx
  api/ (or server actions)
/components/ui               # Button, Card, Toast, Skeleton, EmptyState, ErrorState,
                             # TabBar, Badge, Medal, Mascot, Typography
/lib
  /i18n/fa.ts                # the "necessary Persian" dictionary (typed)
  db.ts                      # prisma client
  auth.ts                    # Auth.js
  motion.ts                  # Framer variants from the motion tokens
  utils.ts
/prisma/schema.prisma
/styles/globals.css          # tokens (section 5)
/design/styleguide.html      # visual reference (commit as-is)
/public                      # mascot/medal assets if extracted
```

Data model (sketch — detailed in Phase 3): `User`, `Progress` (xp, streak, lastActiveDate,
dailyGoal), `Unit`/`Lesson`/`Exercise`, `LessonCompletion`, `Medal`/`Achievement`.

**MVP scope:** content = **grammar → Tenses** only (future topics shown as locked "soon" nodes
inside the Learn path). **Tab bar = Learn · Practice · Guide · Profile** (no League, no Shop).
All four tabs are functional from day one; "coming soon" lives inside the Learn path, not as dead tabs.

## 4. Fonts (next/font)

- **Nunito** — primary app font (English). `--font-en`.
- **Vazirmatn** — Persian body (variable 100–900). `--font-body-fa`.
- **Lalezar** — Persian display, **single weight 400 only** (never apply 700/900; scale via font-size). `--font-display-fa`.

Load via `next/font/google`, expose as CSS variables on `<html>`, map to the tokens below.

## 5. Design tokens → `styles/globals.css`

```css
:root {
  /* Color · functional */
  --color-primary:#0A84FF; --color-primary-ink:#0066D6; --color-primary-tint:#E5F1FF;
  --color-correct:#34C759; --color-correct-ink:#1F9D45; --color-correct-tint:#E3F8E9;
  --color-streak:#FF9500; --color-streak-ink:#D97700; --color-streak-tint:#FFF1DD;
  --color-xp:#F2A81C; --color-xp-ink:#C9820A; --color-xp-tint:#FFF3D6;
  --grad-xp:linear-gradient(180deg,#FFC93D,#E09A12);
  --color-error:#FF3B30; --color-error-ink:#D7271D; --color-error-tint:#FFE5E3;
  /* Color · playful (categories, medals, accents) */
  --color-purple:#BF5AF2; --color-pink:#FF375F; --color-pink-ink:#C71F40; --color-pink-tint:#FFE4EB;
  --color-teal:#64D2FF; --color-yellow:#FFD60A;
  --color-parrot:#2BB7A3; --color-parrot-ink:#1F9C8B; --color-parrot-tint:#DCF3EE;
  /* Color · neutrals (light theme only) */
  --color-bg:#F6F8FB; --color-surface:#FFFFFF; --color-surface-2:#F1F4F9; --color-surface-3:#E7ECF3;
  --color-border:#E2E7EE; --color-border-strong:#C9D0DC;
  --color-text-1:#14171D; --color-text-2:#4B5260; --color-text-3:#8A909C; --color-text-inverse:#FFFFFF;
  /* Spacing (4-base) */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:20px;
  --space-6:24px; --space-8:32px; --space-10:40px; --space-12:48px; --space-16:64px; --space-20:80px;
  /* Radius */
  --radius-xs:6px; --radius-sm:10px; --radius-md:14px; --radius-lg:18px;
  --radius-xl:22px; --radius-2xl:28px; --radius-pill:9999px;
  /* Elevation (cool-slate tinted) */
  --shadow-1:0 1px 2px rgba(20,28,50,.05),0 1px 1px rgba(20,28,50,.04);
  --shadow-2:0 2px 4px rgba(20,28,50,.05),0 6px 14px rgba(20,28,50,.06);
  --shadow-3:0 4px 8px rgba(20,28,50,.06),0 14px 30px rgba(20,28,50,.09);
  --shadow-4:0 10px 20px rgba(20,28,50,.09),0 28px 60px rgba(20,28,50,.15);
  /* Tactile press edge (button's darker bottom lip) */
  --press-edge:4px; --press-edge-color:rgba(0,0,0,.22); --press-edge-soft:rgba(0,0,0,.12);
  /* Type families */
  --font-en:'Nunito',system-ui,sans-serif;
  --font-display-fa:'Lalezar',system-ui,sans-serif;
  --font-body-fa:'Vazirmatn',system-ui,sans-serif;
  /* Motion */
  --ease-out:cubic-bezier(.16,1,.3,1);     /* entrance: fades, slide-ins */
  --ease-playful:cubic-bezier(.34,1.4,.64,1); /* buttons, tab bar, toasts (overshoot) */
  --ease-spring:cubic-bezier(.34,1.4,.64,1);  /* alias -> playful */
  --dur-instant:100ms; --dur-fast:160ms; --dur-base:240ms; --dur-slow:360ms; --dur-celebrate:600ms;
}

html { background:var(--color-bg); color:var(--color-text-1); font-family:var(--font-en); }
/* English-first / LTR default. Persian islands opt in: */
.fa        { font-family:var(--font-body-fa); }
.fa-display{ font-family:var(--font-display-fa); }
```

## 6. Tailwind mapping → `tailwind.config.ts` (theme.extend)

Map the tokens so utilities resolve to the CSS variables (one source of truth):

```ts
theme: { extend: {
  colors: {
    primary:{DEFAULT:'var(--color-primary)',ink:'var(--color-primary-ink)',tint:'var(--color-primary-tint)'},
    correct:{DEFAULT:'var(--color-correct)',ink:'var(--color-correct-ink)',tint:'var(--color-correct-tint)'},
    streak:{DEFAULT:'var(--color-streak)',ink:'var(--color-streak-ink)',tint:'var(--color-streak-tint)'},
    xp:{DEFAULT:'var(--color-xp)',ink:'var(--color-xp-ink)',tint:'var(--color-xp-tint)'},
    error:{DEFAULT:'var(--color-error)',ink:'var(--color-error-ink)',tint:'var(--color-error-tint)'},
    purple:'var(--color-purple)', pink:{DEFAULT:'var(--color-pink)',ink:'var(--color-pink-ink)',tint:'var(--color-pink-tint)'},
    teal:'var(--color-teal)', yellow:'var(--color-yellow)',
    parrot:{DEFAULT:'var(--color-parrot)',ink:'var(--color-parrot-ink)',tint:'var(--color-parrot-tint)'},
    bg:'var(--color-bg)', surface:{DEFAULT:'var(--color-surface)','2':'var(--color-surface-2)','3':'var(--color-surface-3)'},
    border:{DEFAULT:'var(--color-border)',strong:'var(--color-border-strong)'},
    text:{1:'var(--color-text-1)',2:'var(--color-text-2)',3:'var(--color-text-3)',inverse:'var(--color-text-inverse)'},
  },
  spacing:{1:'4px',2:'8px',3:'12px',4:'16px',5:'20px',6:'24px',8:'32px',10:'40px',12:'48px',16:'64px',20:'80px'},
  borderRadius:{xs:'6px',sm:'10px',md:'14px',lg:'18px',xl:'22px','2xl':'28px',pill:'9999px'},
  boxShadow:{1:'var(--shadow-1)',2:'var(--shadow-2)',3:'var(--shadow-3)',4:'var(--shadow-4)'},
  fontFamily:{en:['var(--font-en)'],'fa-display':['var(--font-display-fa)'],'fa-body':['var(--font-body-fa)']},
  transitionTimingFunction:{out:'var(--ease-out)',playful:'var(--ease-playful)',spring:'var(--ease-spring)'},
  transitionDuration:{instant:'100ms',fast:'160ms',base:'240ms',slow:'360ms',celebrate:'600ms'},
}}
```
(Tailwind v4: put the same values in an `@theme` block instead — Claude Code's call.)

## 7. Phase plan

0. **Foundation** (this kit) — repo + tokens + fonts + base layout + Docker/CI skeleton.
1. UI component library (from styleguide).
2. Screens (UI, mock data).
3. DB (Prisma/Postgres) + Auth.js.
4. Gamification logic (XP/streak/medal/league/daily goal).
5. Lesson engine + content + the necessary-Persian dictionary.
6. Motion (Framer) + mascot illustration pass + celebrations.
7. Deploy (server, tooti.academy, TLS, monitoring).

We do **one phase at a time**, reviewed before the next.

---

## 8. PHASE 0 — Claude Code task (paste this)

> Scaffold a new Next.js (App Router) + TypeScript project at the repo root for "Tooti".
> Requirements:
> - Next.js App Router, TypeScript, ESLint + Prettier.
> - Tailwind CSS. Create `styles/globals.css` with the `:root` tokens EXACTLY as in `/design/handoff` section 5, and wire `tailwind.config.ts` theme.extend EXACTLY as section 6. Do not invent or alter token values.
> - Fonts via `next/font/google`: Nunito (app default), Vazirmatn (variable), Lalezar (weight 400 only). Expose as the CSS variables `--font-en`, `--font-body-fa`, `--font-display-fa` on `<html>`.
> - Root layout: `<html lang="en" dir="ltr">`, body uses `--font-en`, background `--color-bg`, text `--color-text-1`.
> - Establish the folder structure from section 3 (empty placeholder files where needed).
> - Add a `/styleguide` dev-only route (or a `tokens` page) that renders swatches of every color/space/radius/shadow token, so we can visually confirm the tokens compiled correctly.
> - Use **logical CSS properties** throughout (margin-inline / padding-inline / text-align:start). No hardcoded left/right.
> - Add `Dockerfile`, `docker-compose.yml` (app + postgres), `.env.example` (DATABASE_URL, AUTH_SECRET), and a basic GitHub Actions workflow (lint + build).
> - Commit `/design/styleguide.html` (provided) as the visual reference. Do NOT copy its markup; it is reference only — real components come in Phase 1.
> - Open a PR (or push to a branch). Provide the dev-server run command.

**Acceptance check (I'll review):** tokens page renders all swatches with correct colors; fonts load;
`lang="en" dir="ltr"`; logical properties used; Docker builds; CI green.
