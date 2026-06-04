import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Tooti',
  description: 'Learn English, the playful way. Built for Persian speakers.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // English-first app: html is English + LTR. Background / text / font come from
  // the design tokens (styles/globals.css), not inline values.
  return (
    <html lang="en" dir="ltr" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
