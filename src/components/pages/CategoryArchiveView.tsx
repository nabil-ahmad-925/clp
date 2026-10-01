import Link from 'next/link';
import type { CategoryArchive } from '@/content/categories';
import styles from './CategoryArchiveView.module.css';

/**
 * Salient blog archive (category or author): the name in a black box under the header, then the posts as a
 * "content overlaid" vertical staggered grid (3 columns; in every group of six the first post is two columns
 * wide and two rows tall on the left, the sixth the same on the right).
 */
export default function CategoryArchiveView({ archive }: { archive: CategoryArchive }) {
  return (
    <div className={styles.page} data-header-tone="dark">
      <div className={styles.headerSpace} aria-hidden />
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.subheader}>{archive.subheader}</span>
          <h1>{archive.title}</h1>
        </div>
      </div>
      <div className={styles.wrap}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {archive.posts.map((post, i) => (
              <div key={post.href} className={styles.item}>
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
                    {post.categories && (
                      <span className={styles.categories}>
                        {post.categories.map((c) => (
                          <Link key={c.href} className={styles.category} href={c.href} style={{ color: c.color, backgroundColor: c.background }}>
                            {c.label}
                          </Link>
                        ))}
                      </span>
                    )}
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
          {archive.pagination && (
            <nav className={styles.pagination} aria-label="Pagination Navigation">
              <ul>
                {archive.pagination.map((p) => (
                  <li key={p.kind + p.label}>
                    {p.href ? (
                      <Link href={p.href}>{p.label}</Link>
                    ) : (
                      <span className={styles.current} aria-current="page">
                        {p.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
