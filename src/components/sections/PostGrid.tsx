import Link from 'next/link';
import type { PostCard } from '@/content/types';
import styles from './PostGrid.module.css';

/**
 * Salient post grid ("content overlaid"): photo cards with a dark overlay and bottom shadow, the title
 * and meta at the bottom left; hover zooms the photo and underlines the title.
 */
export default function PostGrid({ posts, columns = 3 }: { posts: PostCard[]; columns?: number }) {
  return (
    <div className={styles.grid} style={{ '--columns': columns } as React.CSSProperties}>
      {posts.map((post) => (
        <div key={post.href} className={styles.item}>
          <div className={styles.inner}>
            <div className={styles.bgWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {post.image && <img className={styles.bg} src={post.image} alt={post.title} loading="lazy" />}
            </div>
            <div className={styles.overlay} />
            <div className={styles.content}>
              <Link className={styles.link} href={post.href} aria-label={post.title} />
              <div className={styles.main}>
                <h3 className={styles.heading}>
                  <Link href={post.href}>
                    <span>{post.title}</span>
                  </Link>
                </h3>
                {(post.author || post.date) && (
                  <span className={styles.meta}>
                    {post.author && <span className={styles.author}>{post.author}</span>}
                    {post.date && <span className={styles.date}>{post.date}</span>}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
