'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ApplicationKind } from '@/content/applications';
import BecomePartner from '@/components/partners/BecomePartner';
import ProgramModal from './ProgramModal';
import styles from './ListingSections.module.css';

/** Where an organizer offers open play or volunteering (facilities): the partnerships page. */
const PARTNERSHIPS = '/partnerships/';

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const PLANS = [
  {
    tag: 'FREE',
    title: 'Community Listing',
    desc: 'Claim the listing we found for your program and keep it accurate.',
    points: ['Edit details and photos', 'Link out to your own registration', 'Show up in search'],
    cta: 'Claim Your Listing',
    kind: 'community',
    tone: 'light',
  },
  {
    tag: 'PAID',
    title: 'Sponsored Placement',
    desc: 'Boost a camp, clinic or league to the top of category pages.',
    points: ['Featured strip and in-grid placement', 'Clearly labeled as sponsored', 'Pick dates, cities and categories'],
    cta: 'Sponsor a Listing',
    kind: 'sponsored',
    tone: 'dark',
  },
  {
    tag: 'BY INVITATION',
    title: 'CLP Partner',
    desc: 'A full partner page, bookings and payments through CLP.',
    points: ['Verified badge and partner spotlight', 'Booking, check-in and reviews', 'Shop, partnerships and updates'],
    cta: 'Apply to Partner',
    kind: 'partner',
    tone: 'gold',
  },
] as const;

/**
 * "Run a program?": the three ways to be listed, at the end of a listing page. Each card's button opens its form
 * (ProgramModal), sent with the page's category.
 */
export function ProgramPlans({ category, section }: { category?: string; section?: 'experiences' | 'resources' }) {
  const [open, setOpen] = useState<ApplicationKind | null>(null);
  return (
    <section className={styles.plans} data-header-tone="dark">
      <div className={styles.plansHead}>
        <h2 className={`${styles.plansTitle} ${styles.plansTitleBold}`}>Run a Program? Get in Front of More Athletes</h2>
      </div>
      <div className={styles.planGrid}>
        {PLANS.map((p) => (
          <div key={p.title} className={`${styles.plan} ${styles[p.tone]}`}>
            <span className={styles.planTag}>{p.tag}</span>
            <span className={styles.planTitle}>{p.title}</span>
            <span className={styles.planDesc}>{p.desc}</span>
            <div className={styles.planPoints}>
              {p.points.map((point) => (
                <span key={point} className={styles.planPoint}>
                  <span className={styles.planCheck}>
                    <Check />
                  </span>
                  {point}
                </span>
              ))}
            </div>
            {/* Partners apply by signing up (their type and page start there), in a popup; the others send a form. */}
            {p.kind === 'partner' ? (
              <BecomePartner className={styles.planCta}>{p.cta}</BecomePartner>
            ) : (
              <button type="button" className={styles.planCta} aria-haspopup="dialog" onClick={() => setOpen(p.kind)}>
                {p.cta}
              </button>
            )}
          </div>
        ))}
      </div>
      {open && <ProgramModal kind={open} category={category} section={section} onClose={() => setOpen(null)} />}
    </section>
  );
}

const HOST_CARDS = [
  {
    title: 'Host Open Play',
    desc: 'List free games or paid drop-ins. Players book and sign waivers on CLP, and paid sessions pay out to your Stripe.',
    cta: 'List a Session',
  },
  {
    title: 'Find Volunteers & Mentors',
    desc: 'Post shifts, mentoring roles or service trips. Background checks, SafeSport and volunteer hours are built in.',
    cta: 'Post an Opportunity',
  },
] as const;

/** "BRING MORE PEOPLE TO THE FIELD": the gold panel at the end of a facilities page (Volunteering & Open Play design). */
export function HostCta() {
  return (
    <section className={styles.plans} data-header-tone="dark">
      <div className={styles.plansHead}>
        <span className={styles.eyebrowDark}>ORGANIZERS, CLUBS &amp; FACILITIES</span>
        <h2 className={styles.plansTitle}>BRING MORE PEOPLE TO THE FIELD</h2>
      </div>
      <div className={styles.hostGrid}>
        {HOST_CARDS.map((c) => (
          <div key={c.title} className={styles.hostCard}>
            <span className={styles.hostTitle}>{c.title}</span>
            <span className={styles.hostDesc}>{c.desc}</span>
            <Link className={styles.hostCta} href={PARTNERSHIPS}>
              {c.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
