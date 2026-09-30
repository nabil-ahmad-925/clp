import { Fragment } from 'react';
import Link from 'next/link';
import type { AlbumItem } from '@/content/types';
import styles from './PhotoAlbum.module.css';

/** Album overview (NextGEN "compact album"): one bordered card per gallery with its cover, title and photo count. */
export default function PhotoAlbum({ items }: { items: AlbumItem[] }) {
  return (
    <div className={styles.overview}>
      {items.map((item) => (
        // The original's cards are inline-blocks separated by whitespace (part of their 14px spacing).
        <Fragment key={item.href}>
          <div className={styles.card}>
            <div className={styles.box}>
              <Link href={item.href} title={item.title} className={styles.link}>
                {/* eslint-disable-next-line @next/next/no-img-element -- the original 300×300 crop, served as-is */}
                <img src={item.image} alt={item.title} width={300} height={300} />
              </Link>
            </div>
            <h4 className={styles.title}>
              <Link href={item.href} title={item.title}>
                {item.title}
              </Link>
            </h4>
            <p className={styles.counter}>
              <strong>{item.count}</strong>&nbsp;Photos
            </p>
          </div>{' '}
        </Fragment>
      ))}
    </div>
  );
}
