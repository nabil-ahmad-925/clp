import Link from 'next/link';
import RichText from '@/components/ui/RichText';
import AuthorSocials from '@/components/ui/AuthorSocials';
import { ARTICLE_CATEGORIES, authorInitials, companyAuthorProfile } from '@/content/articles';
import type { BlogPost } from '@/content/types';
import styles from './PostView.module.css';

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
 * An article (new design's article template): the black heading with "Updates & News › topic", the title and its date
 * and reading time, the cover photo, then the article (its body exactly as written in the admin), the author's card
 * (their bio and social links: a partner's from their account, the company's authors' from the taxonomy), and "Keep
 * Reading".
 */
export default function PostView({ post }: { post: BlogPost }) {
  const { hero } = post;
  const topic = topicOf(post);
  const company = companyAuthorProfile(hero.author.href);
  const bio = hero.author.bio || company.bio || `Writes for ${COMPANY}.`;
  const socials = hero.author.socials ?? company.socials ?? [];
  const avatar = (size: 'lg' | 'sm', name = hero.author.name) => (
    <span className={`${styles.avatar} ${styles[size]} ${name === COMPANY ? styles.avatarCompany : ''}`} aria-hidden>
      {authorInitials(name)}
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
          {/* The author is on the card under the article. */}
          <p className={styles.dateline}>{[hero.date, hero.readingTime].filter(Boolean).join(' · ')}</p>
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
                <span className={styles.authorBio}>{bio}</span>
                <AuthorSocials name={hero.author.name} socials={socials} className={styles.authorSocials} linkClassName={styles.authorSocial} />
                <div className={styles.authorActions}>
                  <Link href={hero.author.href ?? topic?.href ?? '/updates/'} className={styles.moreFrom}>
                    More from {hero.author.href ? hero.author.name : topic ? topic.name : 'Updates & News'}
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>

        {post.related.posts.length > 0 && (
          <section className={styles.keep}>
            <h2 className={styles.keepTitle}>Keep Reading</h2>
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
