import type { Metadata } from 'next';
import PageHero from '@/components/sections/PageHero';
import FeatureRow from '@/components/sections/FeatureRow';
import TestimonialSlider from '@/components/sections/TestimonialSlider';
import { HashtagBand, IntroBand, TrustedBy } from '@/components/home/HomeBands';
import Section from '@/components/ui/Section';
import { homeHashtag, homeHero, homeIntro, homeServices, testimonials, trustedBy } from '@/content/home';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: { absolute: 'Compete Like Pros™ | Sports, Fitness & Entertainment Experiences' },
  description:
    'CLP empowers athletes, creators, and communities through training, competitions, brand activations, and performance programs.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <PageHero {...homeHero} />
      <IntroBand {...homeIntro} />
      <HashtagBand text={homeHashtag} />
      <TrustedBy {...trustedBy} />

      <div className={styles.services}>
        {homeServices.map((service) => (
          <FeatureRow key={service.title} {...service} />
        ))}
      </div>

      <Section className={styles.testimonialsHeading}>
        <h2>{testimonials.title}</h2>
      </Section>
      <section className={styles.testimonials} data-header-tone="dark">
        <TestimonialSlider items={testimonials.items} />
      </section>
    </>
  );
}
