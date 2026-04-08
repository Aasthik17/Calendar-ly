import type { Metadata } from 'next';
import { DM_Sans, Lora, Noto_Serif, Great_Vibes } from 'next/font/google';
import '@/styles/tokens.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-noto-serif',
  display: 'swap',
});

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-great-vibes',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Calendarly',
  description: 'An interactive calendar component with date range selection, integrated notes, and seasonal hero imagery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${notoSerif.variable} ${lora.variable} ${greatVibes.variable}`}>
      <body>{children}</body>
    </html>
  );
}
