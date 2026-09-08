import type { Metadata } from 'next';
import './globals.css';

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const metadataBase = new URL(configuredSiteUrl.endsWith('/') ? configuredSiteUrl : `${configuredSiteUrl}/`);
const socialImage = new URL('og.png', metadataBase);
const favicon = new URL('favicon.svg', metadataBase);

export const metadata: Metadata = {
  metadataBase,
  title: 'Sunny Week — Family Activity Planner',
  description: 'A simple, colorful weekly and monthly activity planner made for families.',
  icons: { icon: favicon },
  openGraph: {
    title: 'Sunny Week — Family Activity Planner',
    description: 'A happy week starts with a plan. Organize family activities and print a kid-friendly calendar.',
    type: 'website',
    images: [{ url: socialImage, width: 1732, height: 908, alt: 'Sunny Week family activity planner' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sunny Week — Family Activity Planner',
    description: 'A happy week starts with a plan.',
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
