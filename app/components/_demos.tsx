'use client';

import { useState } from 'react';
import { Button, TabBar, Toast } from '@/components/ui';
import { icons } from './_icons';

/** Interactive toast demo — verifies the onClose path + the drop-in animation. */
export function ToastDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex max-w-md flex-col items-start gap-3">
      {open ? (
        <Toast
          type="reward"
          title="Lesson complete!"
          sub="+20 XP · tap × to dismiss"
          icon={icons.reward}
          onClose={() => setOpen(false)}
          className="toast-drop"
        />
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Show toast again
        </Button>
      )}
    </div>
  );
}

/** Interactive TabBar — clicking a tab moves the dot + notch. */
export function TabBarDemo() {
  const [active, setActive] = useState('learn');
  return <TabBar activeId={active} onTabChange={setActive} />;
}
