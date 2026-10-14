import type { Metadata } from 'next';
import styles from '@/components/builder/BuilderPageView.module.css';
import JobsDirectory from '@/components/jobs/JobsDirectory';
import { DirectorySearchProvider, DirectorySearchSlot } from '@/components/sections/DirectorySearch';
import ListingHero from '@/components/sections/ListingHero';
import { jobsMeta } from '@/content/jobs';

export const metadata: Metadata = {
  title: { absolute: jobsMeta.title },
  description: jobsMeta.description,
  alternates: { canonical: '/jobs/' },
};

/** Jobs & Internships (the Resources' jobs category, in the listing pages' design): see JobsDirectory. */
export default function JobsPage() {
  return (
    <DirectorySearchProvider placeholder="Search roles, e.g. coach, intern, events…" label="Role or organization">
      <ListingHero
        title={['Sports Jobs', '& Internships']}
        blurb="Build your career in sports: coaching, events, media and performance roles with CLP and its partners."
      />
      <div className={`${styles.content} ${styles.listing}`} data-header-tone="dark" data-listing="">
        <DirectorySearchSlot />
        <section className={styles.partnerListing}>
          <JobsDirectory />
        </section>
      </div>
    </DirectorySearchProvider>
  );
}
