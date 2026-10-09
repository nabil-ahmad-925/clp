import Link from 'next/link';
import { albumName } from '@/content/gallery';
import type { AlbumItem } from '@/content/types';
import styles from './PhotoAlbum.module.css';

/** A sport's photo albums (new design's "By category"): a grid of square covers, each with its name and photo count. */
export default function PhotoAlbum({ items }: { items: AlbumItem[] }) {
  return (
    <section className={styles.browse}>
      <div className={styles.head}>
        <span className={styles.kicker}>BROWSE</span>
        <h2 className={styles.heading}>By category</h2>
      </div>
      <div className={styles.grid}>
        {items.map((item, i) => (
          <Link key={item.href} href={item.href} className={styles.card}>
            <span className={styles.cover}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the original 300×300 crop, served as-is */}
              <img src={item.image} alt="" width={300} height={300} loading={i < 8 ? 'eager' : 'lazy'} />
            </span>
            <span className={styles.text}>
              <span className={styles.title}>{albumName(item.title)}</span>
              <span className={styles.count}>
                {item.count} {item.count === 1 ? 'photo' : 'photos'}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
