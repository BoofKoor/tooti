import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Spinner,
  Text,
  Toast,
} from '@/components/ui';
import { icons, placeholderArt } from './_icons';
import { ToastDemo } from './_demos';

export const metadata: Metadata = {
  title: 'Tooti · Components',
};

/*
 * Phase 1 · Batch A showcase — every primitive with all variants / sizes /
 * states. Token-driven; the components carry no raw values.
 */

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Text variant="section" as="h2">
          {title}
        </Text>
        {hint ? <Text variant="caption">{hint}</Text> : null}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-4">{children}</div>;
}

export default function ComponentsPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-12">
      <header className="flex flex-col gap-2">
        <Text variant="display" as="h1">
          Component library
        </Text>
        <Text variant="caption">Phase 1 · Batch A + B</Text>
      </header>

      <Section title="Button" hint="Hover & press to feel the tactile press-edge.">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Text variant="caption">Variants</Text>
            <Row>
              <Button variant="primary">Primary</Button>
              <Button variant="confirm">Confirm</Button>
              <Button variant="secondary">Secondary</Button>
            </Row>
          </div>

          <div className="flex flex-col gap-2">
            <Text variant="caption">Sizes</Text>
            <Row>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Row>
          </div>

          <div className="flex flex-col gap-2">
            <Text variant="caption">States</Text>
            <Row>
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
              <Button variant="confirm" loading>
                Saving
              </Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
            </Row>
          </div>

          <div className="flex flex-col gap-2">
            <Text variant="caption">Persian island (fa)</Text>
            <Row>
              <Button fa>ادامه</Button>
              <Button variant="confirm" fa>
                تأیید
              </Button>
            </Row>
          </div>
        </div>
      </Section>

      <Section title="Card" hint="Surface container — configurable radius, padding, shadow.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card radius="lg" shadow={1}>
            <Text variant="section" as="h3">
              lg · shadow-1
            </Text>
            <Text variant="body">A calm surface for grouping content.</Text>
          </Card>
          <Card radius="xl" shadow={2}>
            <Text variant="section" as="h3">
              xl · shadow-2
            </Text>
            <Text variant="body">The default elevation for most cards.</Text>
          </Card>
          <Card radius="2xl" shadow={3}>
            <Text variant="section" as="h3">
              2xl · shadow-3
            </Text>
            <Text variant="body">A lifted card for emphasis.</Text>
          </Card>
          <Card radius="2xl" shadow={4} padding="lg">
            <Text variant="section" as="h3">
              2xl · shadow-4 · pad lg
            </Text>
            <Text variant="body">Maximum elevation with roomy padding.</Text>
          </Card>
        </div>
      </Section>

      <Section title="Typography" hint="English (Nunito) default; Persian faces for fa islands.">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Text variant="caption">English · Nunito</Text>
            <Text variant="display">Learn English</Text>
            <Text variant="section">Master the tenses</Text>
            <Text variant="body">
              Tooti teaches English to Persian speakers with short, playful lessons that build real
              grammar intuition.
            </Text>
            <Text variant="caption">CAPTION · 13PX NUNITO 700</Text>
          </div>
          <div className="flex flex-col gap-3">
            <Text variant="caption">Persian · Lalezar / Vazirmatn</Text>
            <Text variant="display" fa>
              طوطی
            </Text>
            <Text variant="section" fa>
              زمان‌ها را یاد بگیر
            </Text>
            <Text variant="body" fa>
              توتی با درس‌های کوتاه و بازی‌گونه به فارسی‌زبان‌ها انگلیسی یاد می‌دهد.
            </Text>
            <Text variant="caption" fa>
              زیرنویس — وزیرمتن
            </Text>
          </div>
        </div>
      </Section>

      <Section
        title="Badge"
        hint="Filled, tactile (3px edge). XP is gold — corrects the orange XP in the styleguide."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Text variant="caption">Variants</Text>
            <Row>
              <Badge variant="streak" icon="🔥" value={7} label="days" />
              <Badge variant="xp" icon="⭐" value={250} label="XP" />
              <Badge variant="unit" icon="📘" value={3} label="Unit" />
            </Row>
          </div>

          <div className="flex flex-col gap-2">
            <Text variant="caption">Sizes</Text>
            <Row>
              <Badge variant="xp" size="sm" icon="⭐" value={250} label="XP" />
              <Badge variant="xp" size="md" icon="⭐" value={250} label="XP" />
              <Badge variant="xp" size="lg" icon="⭐" value={250} label="XP" />
            </Row>
          </div>
        </div>
      </Section>

      <Section
        title="Toast"
        hint="Presentational — 4 types. Queue / auto-dismiss arrives with screen wiring."
      >
        <div className="flex max-w-md flex-col gap-3">
          <Toast type="success" title="Correct!" sub="Nice work." icon={icons.success} />
          <Toast
            type="reward"
            title="+20 XP earned"
            sub="Daily goal in sight."
            icon={icons.reward}
          />
          <Toast type="error" title="Not quite" sub="Give it another try." icon={icons.error} />
          <Toast type="info" title="New lesson unlocked" icon={icons.info} />
          <ToastDemo />
        </div>
      </Section>

      <Section title="Spinner" hint="Sizes sm / lg. PageLoader centers the lg spinner full-screen.">
        <Row>
          <Spinner size="sm" />
          <Spinner size="lg" />
        </Row>
      </Section>

      <Section
        title="Skeleton"
        hint="Shimmering placeholders; shimmer is dropped under reduced-motion."
      >
        <div className="flex max-w-md flex-col gap-5">
          <Skeleton shape="line" className="w-2/3" />
          <div className="flex flex-col gap-2">
            <Skeleton shape="line" className="w-full" />
            <Skeleton shape="line" className="w-full" />
            <Skeleton shape="line" className="w-4/5" />
          </div>
          <Card>
            <div className="flex items-center gap-4">
              <Skeleton shape="circle" className="h-12 w-12" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton shape="line" className="w-1/2" />
                <Skeleton shape="line" className="w-3/4" />
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Empty & Error states" hint="Reusable StateView presets.">
        <div className="grid gap-6 sm:grid-cols-2">
          <EmptyState
            illustration={placeholderArt}
            title="No lessons yet"
            description="Start your first Tenses lesson to begin building your streak."
            primaryAction={<Button>Start learning</Button>}
            tag="Empty"
          />
          <ErrorState
            illustration={placeholderArt}
            title="Something went wrong"
            description="We could not load your progress. Check your connection and try again."
            primaryAction={<Button variant="secondary">Try again</Button>}
            secondaryAction={{ label: 'Go home' }}
            tag="Error"
          />
        </div>
      </Section>
    </main>
  );
}
