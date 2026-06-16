import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import { ToastProvider } from '@/components/ui';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Tooti',
  description: 'Learn English, the playful way. Built for Persian speakers.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // English-first app: html is English + LTR. Background / text / font come from
  // the design tokens (styles/globals.css), not inline values.
  return (
    <html lang="en" dir="ltr" className={fontVariables} suppressHydrationWarning>
      <body>
        {/* No-flash theme: set the .dark class before paint from the saved
            preference (falling back to the OS setting). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();",
          }}
        />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
