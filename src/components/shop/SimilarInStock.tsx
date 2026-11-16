'use client';

import Link from 'next/link';
import { shopHref } from '@/content/storefront';
import type { WsItem } from '@/content/wholesale';
import { similarInStock } from '@/content/wsRelated';
import w from './wholesale.module.css';

/** On a back-ordered item: one similar item to order now (Programs & pricing's "Suggest a similar in-stock item"). */
export default function SimilarInStock({ item, all }: { item: WsItem; all: WsItem[] }) {
  const alt = similarInStock(item, all);
  if (!alt) return null;
  return (
    <span>
      Need it sooner? <Link href={shopHref({ view: 'bulk', item: alt.id })} className={w.altLink}>{alt.name}</Link> is ready to order now, from ${alt.price.toFixed(2)} a piece.
    </span>
  );
}
