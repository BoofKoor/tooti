import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tooti · Design tokens',
};

/*
 * Dev/QA reference page (handoff §8): renders a swatch of every design token so
 * we can visually confirm §5 compiled correctly. The arrays below hold token
 * NAMES only; each swatch reads its actual value through `var(--token)`, so this
 * page hardcodes no hex / px / ms of its own.
 */

const functionalColors = [
  '--color-primary',
  '--color-primary-ink',
  '--color-primary-tint',
  '--color-correct',
  '--color-correct-ink',
  '--color-correct-tint',
  '--color-streak',
  '--color-streak-ink',
  '--color-streak-tint',
  '--color-xp',
  '--color-xp-ink',
  '--color-xp-tint',
  '--color-error',
  '--color-error-ink',
  '--color-error-tint',
];

const gradients = ['--grad-xp'];

const playfulColors = [
  '--color-purple',
  '--color-pink',
  '--color-pink-ink',
  '--color-pink-tint',
  '--color-teal',
  '--color-yellow',
  '--color-parrot',
  '--color-parrot-ink',
  '--color-parrot-tint',
];

const neutralColors = [
  '--color-bg',
  '--color-surface',
  '--color-surface-2',
  '--color-surface-3',
  '--color-border',
  '--color-border-strong',
  '--color-text-1',
  '--color-text-2',
  '--color-text-3',
  '--color-text-inverse',
];

const spaceTokens = [
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-8',
  '--space-10',
  '--space-12',
  '--space-16',
  '--space-20',
];

const radiusTokens = [
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--radius-pill',
];

const shadowTokens = ['--shadow-1', '--shadow-2', '--shadow-3', '--shadow-4'];

const durationTokens = [
  '--dur-instant',
  '--dur-fast',
  '--dur-base',
  '--dur-slow',
  '--dur-celebrate',
];

const easingTokens = ['--ease-out', '--ease-playful', '--ease-spring'];

const typeSamples = [
  { token: '--font-en', sample: 'The quick brown fox jumps — 0123456789', rtl: false },
  { token: '--font-body-fa', sample: 'متن فارسیِ نمونه برای بدنه — ۰۱۲۳۴۵۶۷۸۹', rtl: true },
  { token: '--font-display-fa', sample: 'تیترِ نمایشی — طوطی', rtl: true },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold text-text-1">{title}</h2>
        {description ? <p className="text-sm text-text-3">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-md ring-1 ring-border"
        style={{ background: `var(${token})` }}
      />
      <figcaption className="text-xs text-text-2">{token}</figcaption>
    </figure>
  );
}

function SwatchGrid({ tokens }: { tokens: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {tokens.map((token) => (
        <Swatch key={token} token={token} />
      ))}
    </div>
  );
}

function MotionRow({
  label,
  durToken,
  easeToken,
}: {
  label: string;
  durToken: string;
  easeToken: string;
}) {
  return (
    <div className="group flex items-center gap-4">
      <code className="w-40 shrink-0 text-xs text-text-2">{label}</code>
      <div className="flex-1 rounded-pill bg-surface-2 p-1">
        <span
          className="block h-4 w-4 rounded-pill bg-primary transition-transform group-hover:translate-x-8"
          style={{
            transitionDuration: `var(${durToken})`,
            transitionTimingFunction: `var(${easeToken})`,
          }}
        />
      </div>
    </div>
  );
}

export default function TokensPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-text-1">Design tokens</h1>
        <p className="text-text-2">
          Visual confirmation that the handoff §5 tokens compiled. Every swatch reads its value from
          a CSS variable — nothing on this page hardcodes a hex, px or ms.
        </p>
      </header>

      <Section title="Color · functional">
        <SwatchGrid tokens={functionalColors} />
      </Section>

      <Section title="Color · gradient">
        <SwatchGrid tokens={gradients} />
      </Section>

      <Section title="Color · playful">
        <SwatchGrid tokens={playfulColors} />
      </Section>

      <Section title="Color · neutrals">
        <SwatchGrid tokens={neutralColors} />
      </Section>

      <Section title="Spacing" description="4-base scale.">
        <div className="flex flex-col gap-3">
          {spaceTokens.map((token) => (
            <div key={token} className="flex items-center gap-4">
              <code className="w-24 shrink-0 text-xs text-text-2">{token}</code>
              <span className="h-4 rounded-xs bg-primary" style={{ width: `var(${token})` }} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {radiusTokens.map((token) => (
            <figure key={token} className="flex flex-col items-center gap-2">
              <div
                className="h-16 w-16 bg-primary-tint ring-1 ring-primary"
                style={{ borderRadius: `var(${token})` }}
              />
              <figcaption className="text-xs text-text-2">{token}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section title="Elevation" description="Cool-slate tinted shadows.">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {shadowTokens.map((token) => (
            <figure key={token} className="flex flex-col items-center gap-3">
              <div
                className="h-20 w-full rounded-lg bg-surface"
                style={{ boxShadow: `var(${token})` }}
              />
              <figcaption className="text-xs text-text-2">{token}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section title="Press edge" description="The button's darker bottom lip.">
        <div className="flex flex-col items-start gap-3">
          <span
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-bold text-text-inverse"
            style={{ boxShadow: '0 var(--press-edge) 0 var(--press-edge-color)' }}
          >
            --press-edge · --press-edge-color
          </span>
          <span
            className="inline-flex items-center justify-center rounded-lg bg-surface-2 px-6 py-3 font-bold text-text-2"
            style={{ boxShadow: '0 var(--press-edge) 0 var(--press-edge-soft)' }}
          >
            --press-edge · --press-edge-soft
          </span>
        </div>
      </Section>

      <Section title="Type families">
        <div className="flex flex-col gap-5">
          {typeSamples.map(({ token, sample, rtl }) => (
            <figure key={token} className="flex flex-col gap-1">
              <figcaption className="text-xs text-text-3">{token}</figcaption>
              <p
                dir={rtl ? 'rtl' : 'ltr'}
                className="text-2xl text-text-1"
                style={{ fontFamily: `var(${token})` }}
              >
                {sample}
              </p>
            </figure>
          ))}
        </div>
      </Section>

      <Section title="Motion" description="Hover a row to play its duration / easing.">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {durationTokens.map((token) => (
              <MotionRow key={token} label={token} durToken={token} easeToken="--ease-playful" />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {easingTokens.map((token) => (
              <MotionRow key={token} label={token} durToken="--dur-slow" easeToken={token} />
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}
