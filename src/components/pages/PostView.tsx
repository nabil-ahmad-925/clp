import Link from 'next/link';
import RichText from '@/components/ui/RichText';
import { ARTICLE_CATEGORIES } from '@/content/articles';
import type { BlogPost } from '@/content/types';
import styles from './PostView.module.css';

/** "Compete Like Pros" -> "CLP", "H C" -> "HC". */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** The company's own articles (its avatar is black, the others' gold). */
const COMPANY = 'Compete Like Pros';

/** The article's topic: its top category (the first category link's), with its page. */
function topicOf(post: BlogPost) {
  const href = post.hero.categories[0]?.href ?? '';
  const slug = href.match(/^\/category\/([^/]+)\//)?.[1];
  const category = ARTICLE_CATEGORIES.find((c) => c.slug === slug);
  // Its Updates & News topic page when it has one (the archive otherwise).
  return category ? { name: category.name, href: category.page ?? `/category/${category.slug}/` } : null;
}

/**
 * An article (new design's article template): the black heading with "Updates & News › topic", the title and the
 * author's line, the cover photo, then the article (its body exactly as written in the admin), the author's card,
 * and "Keep reading".
 */
export default function PostView({ post }: { post: BlogPost }) {
  const { hero } = post;
  const topic = topicOf(post);
  const company = hero.author.name === COMPANY;
  const firstName = hero.author.name.split(/\s+/)[0];
  const avatar = (size: 'lg' | 'md' | 'sm', name = hero.author.name) => (
    <span className={`${styles.avatar} ${styles[size]} ${name === COMPANY ? styles.avatarCompany : ''}`} aria-hidden>
      {initials(name)}
    </span>
  );

  return (
    <div className={styles.page}>
      <section className={styles.head} data-header-tone="light" data-page-hero>
        <div className={styles.headInner}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/updates/">Updates &amp; News</Link>
            {topic && (
              <>
                <span aria-hidden> › </span>
                <Link href={topic.href} className={styles.crumbTopic}>
                  {topic.name}
                </Link>
              </>
            )}
          </nav>
          <h1 className={styles.title}>{hero.title}</h1>
          <div className={styles.byline}>
            {avatar('md')}
            <span className={styles.bylineText}>
              {hero.author.href ? (
                <Link href={hero.author.href} className={styles.bylineName}>
                  {hero.author.name}
                </Link>
              ) : (
                <strong className={styles.bylineName}>{hero.author.name}</strong>
              )}
              <br />
              {[hero.date, hero.readingTime].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
      </section>

      <div className={styles.body} data-header-tone="dark">
        {hero.image && (
          <div className={styles.cover}>
            {/* eslint-disable-next-line @next/next/no-img-element -- the article's cover */}
            <img src={hero.image} alt="" fetchPriority="high" />
          </div>
        )}

        <div className={styles.layout}>
          <article className={styles.article}>
            {/* The body as written in the admin (its own styles). */}
            <RichText html={post.html} className={styles.content} />

            <div className={styles.authorCard}>
              {avatar('lg')}
              <div className={styles.authorText}>
                <span className={styles.kicker}>ABOUT THE AUTHOR</span>
                <strong className={styles.authorName}>{hero.author.name}</strong>
                <span className={styles.authorBio}>{company ? 'News and field reports from the CLP team.' : `Writes for ${COMPANY}.`}</span>
                <div className={styles.authorActions}>
                  <Link href={hero.author.href ?? topic?.href ?? '/updates/'} className={styles.moreFrom}>
                    More from {hero.author.href ? firstName : topic ? topic.name : 'Updates & News'}
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>

        {post.related.posts.length > 0 && (
          <section className={styles.keep}>
            <h2 className={styles.keepTitle}>Keep reading</h2>
            <div className={styles.keepGrid}>
              {post.related.posts.slice(0, 4).map((p) => (
                <Link key={p.href} href={p.href} className={styles.card}>
                  <span className={styles.cardCover}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- the article's cover */}
                    {p.image && <img src={p.image} alt="" loading="lazy" />}
                  </span>
                  {p.topic && <span className={styles.cardTopic}>{p.topic}</span>}
                  <span className={styles.cardTitle}>{p.title}</span>
                  {(p.author || p.date) && (
                    <span className={styles.cardMeta}>
                      {p.author && avatar('sm', p.author)}
                      <span className={styles.cardMetaText}>
                        {p.author && <span className={styles.cardAuthor}>{p.author}</span>}
                        <span>{[p.date, p.readingTime].filter(Boolean).join(' · ')}</span>
                      </span>
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
