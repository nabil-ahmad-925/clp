import w from './wholesale.module.css';

/** A button's count: the number, or a small spinner while it isn't known yet (never a 0 that turns into the real one). */
export default function CountBadge({ n, loading, alert = false }: { n: number; loading: boolean; alert?: boolean }) {
  return <span data-alert={!loading && alert}>{loading ? <i className={w.countSpin} role="status" aria-label="Loading" /> : n}</span>;
}
