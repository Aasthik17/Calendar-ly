import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display, Lora } from 'next/font/google';
import '@/styles/tokens.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif-display',
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
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable} ${lora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
