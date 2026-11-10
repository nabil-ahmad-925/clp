import type { ReactNode } from 'react';
import { APPEAL_LINE, EXPECTATIONS_UPDATED, EXPECTATIONS_VERSION, SECTIONS, eventRules, expectationsHero, ladder, promises, safetySteps, type Point, type Row } from '@/content/expectations';
import { faqsFor, roleCopy, type Audience } from '@/content/expectationsRoles';
import styles from './print.module.css';

const Points = ({ items }: { items: Point[] }) => (
  <ol>
    {items.map((p, i) => (
      <li key={i}>
        <strong>{p.b}</strong> {p.t}
      </li>
    ))}
  </ol>
);
const Rows = ({ items }: { items: Row[] }) => (
  <dl>
    {items.map((r) => (
      <div key={r.q}>
        <dt>{r.q}</dt>
        <dd>{r.a}</dd>
      </div>
    ))}
  </dl>
);

/** Download PDF: every section for the chosen role on paper (the browser's Print → Save as PDF). Hidden on screen. */
export default function ExpectationsPrint({ role }: { role: Audience }) {
  const copy = roleCopy[role];
  const title = (i: number) => SECTIONS[i].title;
  const sub = (i: number) => SECTIONS[i].sub.replace('{who}', copy.who);
  const section = (i: number, body: ReactNode) => (
    <section key={i}>
      <h2>
        {i + 1}. {title(i)}
      </h2>
      <p className={styles.sub}>{sub(i)}</p>
      {body}
    </section>
  );
  return (
    <div className={`print-only ${styles.print}`}>
      <p className={styles.eyebrow}>{expectationsHero.eyebrow} · COMPETE LIKE PROS</p>
      <h1>{expectationsHero.title}</h1>
      <p>{expectationsHero.blurb}</p>
      <p className={styles.sub}>
        For {copy.who} · Version {EXPECTATIONS_VERSION} · Updated {EXPECTATIONS_UPDATED}
      </p>
      {section(0, <Points items={copy.short} />)}
      {section(1, <Rows items={promises} />)}
      {section(
        2,
        <>
          <h3>Always</h3>
          <Points items={copy.dos} />
          <h3>Never</h3>
          <Points items={copy.donts} />
        </>,
      )}
      {section(3, <Rows items={eventRules} />)}
      {section(
        4,
        <>
          <Points items={safetySteps} />
          <p>Someone in danger? Call 911 first.</p>
        </>,
      )}
      {section(
        5,
        <>
          <Points items={ladder.map((s) => ({ b: `${s.t}.`, t: s.d }))} />
          <p>{APPEAL_LINE}</p>
        </>,
      )}
      {section(6, <Rows items={faqsFor(role, '')} />)}
    </div>
  );
}
