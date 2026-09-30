import PageHero from '@/components/sections/PageHero';
import StatementBand from '@/components/sections/StatementBand';
import Faq from '@/components/sections/Faq';
import type { LegalPage } from '@/content/types';

/** Template for the policy pages (terms, privacy, shipping, CA supply chains). */
export default function LegalPageView({ page }: { page: LegalPage }) {
  return (
    <>
      <PageHero {...page.hero} />
      <StatementBand text={page.statement} />
      <Faq variant="shadow" introHtml={page.intro} items={page.sections.map((s) => ({ question: s.title, html: s.html }))} />
    </>
  );
}
