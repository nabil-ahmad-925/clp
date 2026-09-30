import Link from 'next/link';
import type { CategoryArchive } from '@/content/categories';
import styles from './CategoryArchiveView.module.css';

/**
 * Salient blog category archive: the category name in a black box under the header, then the posts as a
 * "content overlaid" grid (3 columns, the first post two columns wide and two rows tall).
 */
export default function CategoryArchiveView({ archive }: { archive: CategoryArchive }) {
  return (
    <div className={styles.page} data-header-tone="dark">
      <div className={styles.headerSpace} aria-hidden />
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.subheader}>Category</span>
          <h1>{archive.title}</h1>
        </div>
      </div>
      <div className={styles.wrap}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {archive.posts.map((post, i) => (
              <div key={post.href} className={`${styles.item} ${i === 0 ? styles.featured : ''}`}>
                <div className={styles.inner}>
                  <div className={styles.bgWrap}>
                    <div className={styles.bg}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- the post's full-size featured image */}
                      {post.image && <img src={post.image} alt={post.title} fetchPriority={i === 0 ? 'high' : undefined} />}
                    </div>
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
                      <span className={styles.meta}>
                        {post.author && <span className={styles.author}>{post.author}</span>}
                        {post.date && <span className={styles.date}>{post.date}</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
