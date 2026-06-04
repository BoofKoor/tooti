import { Text } from '@/components/ui';

export default function GuidePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <Text variant="section" as="h1">
        Guide
      </Text>
      <Text variant="body">Browse the grammar reference any time. Content lands in Phase 5.</Text>
    </div>
  );
}
