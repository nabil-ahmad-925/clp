import type { Metadata } from 'next';
import styles from '@/components/builder/BuilderPageView.module.css';
import WaiversDocuments from '@/components/pages/WaiversDocuments';
import ListingHero from '@/components/sections/ListingHero';

export const metadata: Metadata = {
  title: { absolute: 'Waivers & Documents - Compete Like Pros™' },
  description: 'Every CLP waiver, release, policy and safety guide in one place.',
  alternates: { canonical: '/waivers-documents/' },
};

/** Waivers & Documents (the footer's page): see WaiversDocuments. */
export default function WaiversDocumentsPage() {
  return (
    <>
      <ListingHero title={['Waivers & Documents']} blurb="Every waiver, release, policy and safety guide in one place." />
      <div className={`${styles.content} ${styles.listing}`} data-header-tone="dark" data-listing="">
        <WaiversDocuments />
      </div>
    </>
  );
}
