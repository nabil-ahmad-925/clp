import Image from 'next/image';
import Link from 'next/link';
import type { SpotlightPartner } from '@/content/listings';
import styles from './ListingSections.module.css';

/** Where a program applies to be listed, sponsored or partnered: the partnerships page. */
const PARTNERSHIPS = '/partnerships/';

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/** "Need support right now?": the crisis line, first on the Mental Health & Resilience listings. */
export function CrisisNotice() {
  return (
    <div className={styles.crisis} role="note">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
      </svg>
      <span className={styles.crisisText}>
        <strong>Need support right now?</strong> In the US, call or text <strong>988</strong> to reach the Suicide &amp; Crisis Lifeline, any time. In an
        emergency, call 911.
      </span>
    </div>
  );
}

/** Initials for a partner without a photo ("Boston Athletic Training" -> "BAT"). */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('');

/** The black "CLP Partners" band between the results: partners from the partner directory, and a link to all of them. */
export function PartnerSpotlight({ partners, section }: { partners: SpotlightPartner[]; section: 'experiences' | 'resources' }) {
  if (partners.length === 0) return null;
  const resources = section === 'resources';
  return (
    <section className={styles.spotlight} data-header-tone="light">
      <div className={styles.spotlightInner}>
        <div className={styles.spotlightHead}>
          <div className={styles.headText}>
            <span className={styles.eyebrow}>CLP PARTNERS</span>
            <h2 className={styles.spotlightTitle}>{resources ? 'Experts we back' : 'Train with the people we back'}</h2>
            <p className={styles.spotlightSub}>
              {resources
                ? 'Verified CLP partners. Licensed and certified providers are marked on their listing.'
                : 'Verified programs that book, pay and check in through CLP.'}
            </p>
          </div>
          <Link className={styles.allPartners} href="/clp-partners/">
            View all partners
          </Link>
        </div>
        <div className={styles.partners}>
          {partners.map((p) => (
            <Link key={p.href} className={styles.partner} href={p.href}>
              <div className={styles.partnerMedia}>
                {p.image && <Image className={styles.partnerImage} src={p.image} alt="" fill sizes="(max-width: 767px) 100vw, 320px" />}
                <span className={styles.partnerLogo} aria-hidden>
                  {p.image ? <Image src={p.image} alt="" width={64} height={64} /> : initials(p.name)}
                </span>
              </div>
              <div className={styles.partnerBody}>
                <span className={styles.partnerName}>{p.name}</span>
                {p.excerpt && <span className={styles.partnerMeta}>{p.excerpt}</span>}
                <span className={styles.partnerLink}>
                  View partner<span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  {
    tag: 'FREE',
    title: 'Community listing',
    desc: 'Claim the listing we found for your program and keep it accurate.',
    points: ['Edit details and photos', 'Link out to your own registration', 'Show up in search'],
    cta: 'Claim your listing',
    tone: 'light',
  },
  {
    tag: 'PAID',
    title: 'Sponsored placement',
    desc: 'Boost a camp, clinic or league to the top of category pages.',
    points: ['Featured strip and in-grid placement', 'Clearly labeled as sponsored', 'Pick dates, cities and categories'],
    cta: 'Sponsor a listing',
    tone: 'dark',
  },
  {
    tag: 'BY INVITATION',
    title: 'CLP Partner',
    desc: 'A full partner page, bookings and payments through CLP.',
    points: ['Verified badge and partner spotlight', 'Booking, check-in and reviews', 'Shop, partnerships and updates'],
    cta: 'Apply to partner',
    tone: 'gold',
  },
] as const;

/** "Run a program?": the three ways to be listed, at the end of a listing page. */
export function ProgramPlans() {
  return (
    <section className={styles.plans} data-header-tone="dark">
      <div className={styles.plansHead}>
        <span className={styles.eyebrowDark}>RUN A PROGRAM?</span>
        <h2 className={styles.plansTitle}>Get in front of more athletes</h2>
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
            <Link className={styles.planCta} href={PARTNERSHIPS}>
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

const HOST_CARDS = [
  {
    title: 'Host open play',
    desc: 'List free games or paid drop-ins. Players book and sign waivers on CLP, and paid sessions pay out to your Stripe.',
    cta: 'List a session',
  },
  {
    title: 'Find volunteers & mentors',
    desc: 'Post shifts, mentoring roles or service trips. Background checks, SafeSport and volunteer hours are built in.',
    cta: 'Post an opportunity',
  },
] as const;

/** "Bring more people to the field": the gold panel at the end of a facilities page (Volunteering & Open Play design). */
export function HostCta() {
  return (
    <section className={styles.plans} data-header-tone="dark">
      <div className={styles.plansHead}>
        <span className={styles.eyebrowDark}>ORGANIZERS, CLUBS &amp; FACILITIES</span>
        <h2 className={styles.plansTitle}>Bring more people to the field</h2>
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
