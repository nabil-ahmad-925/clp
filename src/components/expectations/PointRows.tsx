import type { Point } from '@/content/expectations';
import rows from './rows.module.css';

type Mark = 'number' | 'always' | 'never';
const MARK_CLASS: Record<Mark, string> = { number: rows.markGold, always: rows.markGreen, never: rows.markRed };

/** Lines between thin rules, each with a circled mark (1, 2, 3 or ✓ / ✕) and its bold lead. */
export default function PointRows({ points, mark }: { points: Point[]; mark: Mark }) {
  const Tag = mark === 'number' ? 'ol' : 'ul';
  return (
    <Tag className={rows.list}>
      {points.map((p, i) => (
        <li key={i} className={rows.point}>
          <span className={`${rows.mark} ${MARK_CLASS[mark]}`} aria-hidden>
            {mark === 'number' ? i + 1 : mark === 'always' ? '✓' : '✕'}
          </span>
          <span className={rows.text}>
            <strong>{p.b}</strong> {p.t}
          </span>
        </li>
      ))}
    </Tag>
  );
}
