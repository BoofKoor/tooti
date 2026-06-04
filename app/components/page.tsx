import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Badge, Button, Card, Text } from '@/components/ui';

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
        <Text variant="caption">Phase 1 · Batch A — primitives</Text>
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
    </main>
  );
}
