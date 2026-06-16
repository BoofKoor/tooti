'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from '@phosphor-icons/react/dist/ssr';

/**
 * Light/dark theme toggle. The pre-paint script in the root layout sets the
 * initial `.dark` class from localStorage (or the OS); this just flips + persists
 * it. Mounted-guarded so the icon matches the real DOM state (no hydration flash).
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* storage unavailable — the toggle still works for this session */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      className="prof-icon-btn"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={mounted ? dark : undefined}
      onClick={toggle}
    >
      {dark ? <Sun weight="fill" /> : <Moon weight="fill" />}
    </button>
  );
}
