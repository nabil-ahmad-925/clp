import PageHero from '@/components/sections/PageHero';
import QuoteSlider from '@/components/sections/QuoteSlider';
import FeatureRow from '@/components/sections/FeatureRow';
import SectionHeading from '@/components/sections/SectionHeading';
import FacilityCards from '@/components/sections/FacilityCards';
import TileCarousel from '@/components/sections/TileCarousel';
import Faq from '@/components/sections/Faq';
import Button from '@/components/ui/Button';
import { Container } from '@/components/ui/Section';
import { directorySource } from '@/content/builder';
import type { SportPage } from '@/content/types';
import styles from './SportPageView.module.css';

/** Template shared by the 12 sport pages under /experiences and /resources. */
export default function SportPageView({ page }: { page: SportPage }) {
  const { hero, quotes, features, facilities, updates, faq } = page;
  return (
    <>
      <PageHero title={hero.title} height="fullscreen" backgroundColor={hero.backgroundColor} backgroundImage={hero.backgroundImage} />
      <QuoteSlider quotes={quotes} />

      {features.map((feature) => (
        <FeatureRow key={feature.title} {...feature} />
      ))}

      <SectionHeading title={facilities.title} spaced />
      {/* The facilities of this sport from the listings API (what "View all" lists), else the built-in cards. */}
      <FacilityCards items={facilities.items} live={facilities.viewAll ? directorySource(facilities.viewAll.href) : undefined} />
      {facilities.viewAll && (
        <section className={styles.viewAll} data-header-tone="dark">
          <Container>
            <Button href={facilities.viewAll.href} newTab={facilities.viewAll.newTab} color="dark">
              {facilities.viewAll.label}
            </Button>
          </Container>
        </section>
      )}

      <SectionHeading title={updates.title} spaced />
      <TileCarousel tiles={updates.tiles} />

      <Faq {...faq} />
    </>
  );
}
