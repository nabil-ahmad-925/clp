'use client';

import { useSearchParams } from 'next/navigation';
import styles from '../preorders/Preorder.module.css';
import LinkView from './LinkView';
import PickView from './PickView';

/** /link/?p=<page>&l=<link> is a share link, /link/?x=<id>&t=<secret> a person's own pick from a paid-for one. */
export default function LinkPage() {
  const params = useSearchParams();
  const [page, link, pick, token] = ['p', 'l', 'x', 't'].map((k) => params.get(k) ?? '');
  return (
    <>
      <section className={styles.band} data-header-tone="light" />
      <div className={styles.page} data-header-tone="dark">
        {pick && token ? <PickView id={pick} token={token} /> : page && link ? <LinkView page={page} link={link} /> : <p className={styles.muted}>This link isn’t complete. Use the link you were sent.</p>}
      </div>
    </>
  );
}
