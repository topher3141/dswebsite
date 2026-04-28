import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deals & Steals | Glen Burnie Discount Store',
  description: 'Deals & Steals is a locally owned discount store in Glen Burnie, Maryland with fresh closeout deals, overstock finds, and new arrivals weekly.',
  openGraph: {
    title: 'Deals & Steals | Glen Burnie Discount Store',
    description: 'Your hometown spot for brand-name bargains.',
    url: 'https://www.dealsandstealsmd.com',
    siteName: 'Deals & Steals',
    images: [
      {
        url: 'https://i.imgur.com/x818kSV.png',
        width: 1200,
        height: 630,
        alt: 'Deals & Steals logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
