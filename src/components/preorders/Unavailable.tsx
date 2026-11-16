import Link from 'next/link';
import styles from './Preorder.module.css';

/** Why a share link or pre-order didn't load: the API's message and code (clp-api links-public / preorders-public). */
export type LoadError = { message: string; code: string; status: number };

/** Turns what a load threw into a LoadError. */
export const loadErrorOf = (err: unknown, fallback: string): LoadError => {
  const e = err as { message?: string; code?: string; status?: number };
  return { message: e?.message || fallback, code: e?.code ?? '', status: e?.status ?? 0 };
};

const TITLES: Record<string, string> = {
  NOT_APPROVED: 'Not open yet',
  NOT_OPEN: 'Not open yet',
  PAGE_NOT_LIVE: 'Not open yet',
  CANCELLED: 'Cancelled',
};

/**
 * A share link or pre-order buyers can't open yet (or any more), said plainly: waiting for CLP's check, being updated
 * by the club, cancelled, or not found. Network trouble shows the message as it is.
 */
export default function Unavailable({ error, what }: { error: LoadError; what: 'link' | 'pre-order' }) {
  const missing = error.code === 'NOT_FOUND' || error.status === 404;
  const title = TITLES[error.code] ?? (missing ? `This ${what} isn’t open` : `Couldn’t load this ${what}`);
  const text = missing ? `It may still be waiting for CLP to approve it, or the club closed or changed it. Ask the club that sent it for the latest link.` : error.message;
  return (
    <section className={styles.notice} role="status">
      <h1 className={styles.noticeTitle}>{title}</h1>
      <p className={styles.muted}>{text}</p>
      <Link href="/shop/" className={styles.noticeLink}>
        Browse the Shop
      </Link>
    </section>
  );
}
