import { faqsFor, roleCopy, type Audience } from '@/content/expectationsRoles';
import faq from '@/components/faq/FaqCenter.module.css';
import OpenRows from './OpenRows';
import rows from './rows.module.css';

type Props = { role: Audience; query: string; onQuery: (q: string) => void; open: number; onToggle: (i: number) => void };

/** The FAQ section: the role's questions and everyone's (each tagged), searchable, with the empty message. */
export default function FaqSection({ role, query, onQuery, open, onToggle }: Props) {
  const items = faqsFor(role, query).map((f) => ({ q: f.q, a: f.a, tag: f.role === 'all' ? 'EVERYONE' : roleCopy[role].label.toUpperCase() }));
  return (
    <>
      <div className={rows.search} role="search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input type="search" aria-label="Search questions" placeholder="Search these questions" value={query} onChange={(e) => onQuery(e.target.value)} />
      </div>
      <OpenRows items={items} open={open} onToggle={onToggle} idPrefix="exp-faq" />
      {/* No matches: the empty list keeps its top rule above the message, as the design. */}
      {items.length === 0 && (
        <p className={faq.empty} role="status">
          No matches. Try another word, or ask us below.
        </p>
      )}
    </>
  );
}
