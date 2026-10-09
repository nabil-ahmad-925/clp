import type { Metadata } from 'next';
import Link from 'next/link';
import StartProject from '@/components/about/StartProject';
import styles from '@/components/about/About.module.css';
import {
  aboutHero,
  aboutMeta,
  aboutMissionVision,
  aboutPillars,
  aboutProof,
  aboutServe,
  aboutTrusted,
  aboutWho,
  howWeWork,
  startProject,
} from '@/content/about';

export const metadata: Metadata = {
  title: { absolute: aboutMeta.title },
  description: aboutMeta.description,
  alternates: { canonical: '/about-us/' },
};

/**
 * About Us (new design): the heading over a photo, the gold proof strip, who we are, mission and vision, what we do,
 * how we work, who we serve, who trusts us, and "Start a project".
 */
export default function AboutPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} data-header-tone="light" data-page-hero>
        {/* eslint-disable-next-line @next/next/no-img-element -- a dimmed background photo */}
        <img className={styles.heroImage} src={aboutHero.image} alt="" />
        <span className={styles.heroShade} aria-hidden />
        <div className={styles.heroInner}>
          <span className={styles.kickerGold}>{aboutHero.kicker}</span>
          <h1 className={styles.heroTitle}>{aboutHero.title}</h1>
          <span className={styles.tagline}>{aboutHero.tagline}</span>
          <span className={styles.hashtag}>{aboutHero.hashtag}</span>
          <div className={styles.heroActions}>
            {aboutHero.actions.map((a, i) => (
              <Link key={a.href} href={a.href} className={i === 0 ? styles.buttonGold : styles.buttonOutline}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.proof} data-header-tone="dark">
        <div className={styles.proofInner}>
          {aboutProof.map((p) => (
            <div key={p.label} className={styles.proofItem}>
              <span className={styles.proofValue}>{p.value}</span>
              <span className={styles.proofLabel}>{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.who} data-header-tone="dark">
        <span className={styles.kicker}>{aboutWho.kicker}</span>
        <h2 className={styles.bigTitle}>
          {aboutWho.title[0]}
          <br />
          {aboutWho.title[1]}
        </h2>
        <p className={styles.lead}>{aboutWho.text}</p>
        <div className={styles.traits}>
          {aboutWho.traits.map((t, i) => (
            <div key={t.name} className={`${styles.trait} ${i === 1 ? styles.traitDark : ''}`}>
              <span className={styles.traitName}>{t.name}</span>
              <span className={styles.traitText}>{t.text}</span>
            </div>
          ))}
        </div>
        <p className={styles.closing}>{aboutWho.closing}</p>
      </section>

      <section className={styles.mvBand} data-header-tone="dark">
        <div className={styles.mvGrid}>
          {aboutMissionVision.map((m) => (
            <div key={m.kicker} className={`${styles.mv} ${m.dark ? styles.mvDark : ''}`}>
              <span className={styles.mvKicker}>{m.kicker}</span>
              <span className={styles.mvTitle}>{m.title}</span>
              <span className={styles.mvRule} aria-hidden />
              <span className={styles.mvText}>{m.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.what} data-header-tone="dark">
        <span className={styles.kicker}>WHAT WE DO</span>
        <h2 className={styles.bigTitle}>One platform. Endless possibilities.</h2>
        <div className={styles.pillars}>
          {aboutPillars.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className={styles.pillar}
              target={p.external ? '_blank' : undefined}
              rel={p.external ? 'noopener' : undefined}
            >
              <span className={styles.pillarImage}>
                {/* eslint-disable-next-line @next/next/no-img-element -- the site's own photos */}
                {p.image && <img src={p.image} alt="" loading="lazy" />}
              </span>
              <span className={styles.pillarTitle}>{p.title}</span>
              <span className={styles.pillarText}>{p.text}</span>
              <span className={styles.pillarCta}>{p.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.how} data-header-tone="dark">
        <div className={styles.howInner}>
          <div className={styles.howHead}>
            <span className={styles.kickerBrown}>{howWeWork.kicker}</span>
            <h2 className={`${styles.bigTitle} ${styles.onGold}`}>{howWeWork.title}</h2>
          </div>
          <div className={styles.steps}>
            <span className={styles.stepsLine} aria-hidden />
            {howWeWork.steps.map((s, i) => (
              <div key={s.title} className={styles.step}>
                <span className={styles.stepNumber}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.stepTitle}>{s.title}</span>
                <span className={styles.stepText}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.serve} data-header-tone="dark">
        <span className={styles.kicker}>{aboutServe.kicker}</span>
        <h2 className={styles.bigTitle}>{aboutServe.title}</h2>
        <div className={styles.serveGrid}>
          {aboutServe.groups.map((g) => (
            <span key={g.title} className={styles.serveItem}>
              <strong>{g.title}</strong>
              <span>{g.text}</span>
            </span>
          ))}
        </div>
      </section>

      <section className={styles.trusted} data-header-tone="light">
        <div className={styles.trustedInner}>
          <span className={styles.kickerGold}>{aboutTrusted.kicker}</span>
          <div className={styles.logos}>
            {aboutTrusted.logos.map((l) => (
              <span key={l.src} className={styles.logo}>
                {/* eslint-disable-next-line @next/next/no-img-element -- partner logos */}
                <img src={l.src} alt={l.alt} loading="lazy" />
              </span>
            ))}
          </div>
          <p className={styles.trustedText}>{aboutTrusted.text}</p>
        </div>
      </section>

      <section id="start" className={styles.start} data-header-tone="light">
        {/* eslint-disable-next-line @next/next/no-img-element -- a dimmed background photo */}
        <img className={styles.startImage} src={startProject.image} alt="" loading="lazy" />
        <div className={styles.startInner}>
          <h2 className={`${styles.bigTitle} ${styles.startTitle}`}>
            {startProject.title[0]}
            <br />
            {startProject.title[1]}
          </h2>
          <p className={styles.startText}>{startProject.text}</p>
          <StartProject email={startProject.email} types={startProject.types} />
        </div>
      </section>
    </div>
  );
}
