import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Services - Compete Like Pros™' },
  alternates: { canonical: '/services/' },
};

// The live /services/ page has no content of its own: a solid header followed by the footer.
// Each service lives under /services/<slug>/ (linked from the service pages' VIEW MORE buttons).
export default function ServicesPage() {
  return <div style={{ height: 'calc(var(--header-height) + 40px)', background: '#fff' }} aria-hidden />;
}
