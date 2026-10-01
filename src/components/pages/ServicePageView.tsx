import PageHero from '@/components/sections/PageHero';
import StatementBand from '@/components/sections/StatementBand';
import SectionHeading from '@/components/sections/SectionHeading';
import FacilityCards from '@/components/sections/FacilityCards';
import TileCarousel from '@/components/sections/TileCarousel';
import Faq from '@/components/sections/Faq';
import Button from '@/components/ui/Button';
import { Container } from '@/components/ui/Section';
import type { ServicePage } from '@/content/types';
import styles from './SportPageView.module.css';

/** Template shared by the 7 service pages. */
export default function ServicePageView({ page }: { page: ServicePage }) {
  const { hero, intro, support, services, recent, faq } = page;
  return (
    <>
      <PageHero {...hero} />
      <StatementBand text={intro} />

      <SectionHeading title={support.title} text={support.text} textItalic={support.italic} spaced />
      <FacilityCards items={services.items} />
      {services.viewAll && (
        <section className={styles.viewAll} data-header-tone="dark">
          <Container>
            <Button href={services.viewAll.href} newTab={services.viewAll.newTab} color="dark">
              {services.viewAll.label}
            </Button>
          </Container>
        </section>
      )}

      <SectionHeading title={recent.title} spaced narrow />
      <TileCarousel tiles={recent.tiles} />

      <Faq {...faq} viewAllGap={24} />
    </>
  );
}
