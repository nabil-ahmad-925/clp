import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'RESOURCES - Compete Like Pros™' },
  alternates: { canonical: '/resources/' },
};

// The live /resources/ page has no content of its own: a solid header followed by the footer.
// Each sport's resources live under /resources/<sport>/ (linked from the menu).
export default function ResourcesPage() {
  return <div style={{ height: 'calc(var(--header-height) + 40px)', background: '#fff' }} aria-hidden />;
}
