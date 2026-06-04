import { Text } from '@/components/ui';

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <Text variant="section" as="h1">
        Profile
      </Text>
      <Text variant="body">
        XP, streak, daily goal and medals show up here. Arrives in Batch 2E.
      </Text>
    </div>
  );
}
