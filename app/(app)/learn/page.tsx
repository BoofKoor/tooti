import { Text } from '@/components/ui';

export default function LearnPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <Text variant="section" as="h1">
        Learn
      </Text>
      <Text variant="body">
        The Tenses lesson path (future topics as locked “soon” nodes) lands in Batch 2B.
      </Text>
    </div>
  );
}
