import type { Metadata, Viewport } from 'next';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import FooterGate from '@/components/layout/FooterGate';
import BackToTop from '@/components/layout/BackToTop';
import { SITE_URL, site } from '@/content/site';
import { fontVariables } from './fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || SITE_URL),
  title: {
    default: 'Compete Like Pros™ | Sports, Fitness & Entertainment Experiences',
    template: '%s - Compete Like Pros™',
  },
  applicationName: site.name,
  icons: {
    icon: [
      { url: site.favicon.small, sizes: '32x32' },
      { url: site.favicon.large, sizes: '192x192' },
    ],
    apple: site.favicon.apple,
  },
  // Images load directly from competelikepros.com; sending no referrer keeps its
  // hotlink protection from rejecting them.
  referrer: 'no-referrer',
  openGraph: { siteName: site.name, locale: 'en_US', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-US" className={fontVariables}>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <FooterGate>
          <SiteFooter />
        </FooterGate>
        <BackToTop />
      </body>
    </html>
  );
}
