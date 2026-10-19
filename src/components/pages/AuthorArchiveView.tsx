import Link from 'next/link';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { ArticleCard } from '@/components/sections/PostFilter';
import AuthorSocials from '@/components/ui/AuthorSocials';
import { authorInitials, companyAuthorProfile } from '@/content/articles';
import type { ArchivePost, CategoryArchive } from '@/content/categories';
import type { FilterPost } from '@/content/types';
import pager from '@/components/ui/Pager.module.css';
import styles from './AuthorArchiveView.module.css';

/** An archive post as an article list's card (the article lists' card, its date as "26 / JUN"). */
function toCard(post: ArchivePost): FilterPost {
  const day = new Date(post.date ?? '');
  const dated = !Number.isNaN(day.getTime());
  return {
    id: post.href,
    categories: [],
    day: dated ? String(day.getDate()).padStart(2, '0') : '',
    month: dated ? day.toLocaleDateString('en-US', { month: 'short' }) : '',
    image: post.image,
    imageAlt: post.title,
    imageWidth: 300,
    imageHeight: 200,
    title: post.title,
    href: post.href,
    excerpt: '',
    comments: '',
    // Every card is this author's: the reading time alone.
    readingTime: post.readingTime,
  };
}

/**
 * An author's articles (/author/<slug>/, "More from …" on an article), in the new design of the article lists: a black
 * heading (its bottom line "← Updates & News") with the author's avatar, name, bio and social links, then their articles as the
 * article lists' cards (three a row, newest first) and the page links. While a page loads (`loading`) the grid
 * shimmers.
 */
export default function AuthorArchiveView({ archive, loading }: { archive: CategoryArchive; loading?: boolean }) {
  const { bio, socials = [] } = companyAuthorProfile(archive.path);
  return (
    <div className={styles.page}>
      <section className={styles.hero} data-header-tone="light" data-page-hero>
        <div className={styles.heroInner}>
          <span className={styles.avatar} aria-hidden>
            {authorInitials(archive.title)}
          </span>
          <span className={styles.kicker}>ARTICLES BY</span>
          <h1 className={styles.title}>{archive.title}</h1>
          {bio && <p className={styles.bio}>{bio}</p>}
          <AuthorSocials name={archive.title} socials={socials} className={styles.socials} linkClassName={styles.social} />
          <Link href="/updates/" className={styles.back}>
            <span className="glyph" aria-hidden>
              ←
            </span>{' '}
            Updates &amp; News
          </Link>
        </div>
      </section>

      <div className={styles.body} data-header-tone="dark">
        {loading ? (
          <div className={styles.grid} aria-busy="true" aria-label="Loading the articles">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : archive.posts.length > 0 ? (
          <div className={styles.grid}>
            {archive.posts.map((post, i) => (
              <ArticleCard key={post.href} post={toCard(post)} eager={i < 3} />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No articles yet.</p>
        )}

        {!loading && archive.pagination && (
          <nav className={styles.pager} aria-label="Pages">
            {archive.pagination.map((p, i) => {
              const key = `${p.kind}${p.label}${i}`;
              if (p.kind === 'gap') {
                return (
                  <span key={key} className={pager.pagerGap} aria-hidden>
                    …
                  </span>
                );
              }
              const step = p.kind === 'prev' || p.kind === 'next';
              const label = (
                <>
                  {p.kind === 'prev' && <LuChevronLeft aria-hidden />}
                  {p.label}
                  {p.kind === 'next' && <LuChevronRight aria-hidden />}
                </>
              );
              const className = `${step ? pager.pagerStep : pager.pagerNum} ${p.href ? '' : pager.pagerOn}`;
              return p.href ? (
                <Link key={key} href={p.href} className={className} aria-label={step ? undefined : `Page ${p.label}`}>
                  {label}
                </Link>
              ) : (
                <span key={key} className={className} aria-current="page">
                  {label}
                </span>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
