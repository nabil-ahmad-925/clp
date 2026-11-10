import type { Row } from '@/content/expectations';
import faqRows from '@/components/faq/FaqRows.module.css';
import rows from './rows.module.css';

type Props = { items: (Row & { tag?: string })[]; open: number; onToggle: (i: number) => void; idPrefix: string };

/** The FAQ's rows (gold-ring + / −), one open at a time. */
export default function OpenRows({ items, open, onToggle, idPrefix }: Props) {
  return (
    <div className={faqRows.list}>
      {items.map((x, i) => {
        const isOpen = i === open;
        const id = `${idPrefix}-${i}`;
        return (
          <div key={x.q} className={faqRows.item}>
            <button type="button" className={faqRows.question} aria-expanded={isOpen} aria-controls={id} onClick={() => onToggle(i)}>
              <span className={faqRows.questionText}>
                {x.tag && <span className={faqRows.tag}>{x.tag}</span>}
                <span className={faqRows.q}>{x.q}</span>
              </span>
              <span className={`${faqRows.sign} ${rows.sign}`} aria-hidden>
                {isOpen ? '−' : '+'}
              </span>
            </button>
            <div id={id} hidden={!isOpen}>
              <div className={faqRows.answer}>
                <p>{x.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
