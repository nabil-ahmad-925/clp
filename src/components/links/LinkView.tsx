'use client';

import Link from 'next/link';
import type { GiftItem, PublicLink, SellProduct } from '@/content/links';
import styles from '../preorders/Preorder.module.css';
import GiftLink from './GiftLink';
import LockedLink from './LockedLink';
import SellLink from './SellLink';
import { useLink } from './useLink';

const CLOSED: Partial<Record<PublicLink['phase'], string>> = { closed: 'This link has closed.' };

/** A share link: its heading, then the lock, the products for sale, or the free picks. */
export default function LinkView({ page, link }: { page: string; link: string }) {
  const { data, key, error, unlock } = useLink(page, link);
  if (error) return <p className={styles.error}>{error}</p>;
  if (!data) return <p className={styles.muted}>Loading…</p>;
  const closed = CLOSED[data.phase];
  return (
    <>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>
          {data.kind === 'gift' ? 'Picked for you by' : 'From'} <Link href={`/partner/?p=${encodeURIComponent(data.partner.slug)}`}>{data.partner.name}</Link>
        </span>
        <h1 className={styles.title}>{data.name}</h1>
        {closed && <p className={styles.phase}>{closed}</p>}
        {data.closes && !closed && (
          <p className={styles.meta}>Open until {new Date(`${data.closes}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
        )}
      </header>
      {data.locked ? (
        <LockedLink link={data} onUnlock={unlock} />
      ) : data.kind === 'gift' ? (
        <GiftLink page={page} link={link} data={data} items={(data.items ?? []) as GiftItem[]} keyValue={key} />
      ) : (
        <SellLink partner={data.partner.slug} items={(data.items ?? []) as SellProduct[]} />
      )}
    </>
  );
}
