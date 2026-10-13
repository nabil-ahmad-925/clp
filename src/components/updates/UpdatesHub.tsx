'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArticleCard } from '@/components/sections/PostFilter';
import { ARTICLE_CATEGORIES, articleDate, articlesEnabled, authorOf, fetchArticles, storyCard, type ArticleSummary } from '@/content/articles';
import type { Post } from '@/content/types';
import { updatesTopics } from '@/content/updates';
// The featured stories are laid out as the listing pages' sponsored strip (two wide photo cards).
import strip from '@/components/sections/ListingCard.module.css';
import styles from './UpdatesHub.module.css';

/** A story on the hub: a live article, or a built-in post until they load (no author or reading time). */
type Story = { href: string; title: string; image: string; date?: string; author?: string; read?: string; topic?: string };

/** A built-in section of the page (its category's slug and built-in posts). */
export type HubSection = { title: string; category?: string; href: string; posts: Post[] };

/** How many stories a topic section shows (one row). */
const SECTION_SIZE = 4;

/** A category's card label ("FIELD REPORTS"). */
const topicShort = (category?: string) => (category ? updatesTopics[category]?.short : undefined);

/** The first of an article's categories that has a section on the hub. */
const topicOf = (a: ArticleSummary) => a.categories.map((c) => c.split('/')[0]).find((c) => updatesTopics[c]);

const fromArticle = (a: ArticleSummary): Story => ({
  href: a.path,
  title: a.title,
  image: a.image,
  date: articleDate(a.publishedAt),
  author: authorOf(a).name,
  read: `${a.readingTime} min read`,
  topic: topicShort(topicOf(a)),
});

const fromPost = (p: Post, category?: string): Story => ({ href: p.href, title: p.title, image: p.image, date: p.date, topic: topicShort(category) });

/** "Compete Like Pros | June 26, 2026 | 6 min read" (what is known). */
const metaLine = (s: Story) => [s.author, s.date, s.read].filter(Boolean).join(' | ');

/** How many featured stories the top row shows (as the listing pages' sponsored strip). */
const FEATURED_SIZE = 2;

/**
 * The featured row, as the listing pages' sponsored strip: two wide photo cards with the "FEATURED" label, the topic,
 * the title, the byline and "Read More". The stories tagged Trending, newest first, topped up with the newest articles;
 * the newest built-in posts until they load.
 */
export function FeaturedStories({ sections }: { sections: HubSection[] }) {
  const builtIn = sections
    .flatMap((s) => s.posts.map((p) => fromPost(p, s.category)))
    .filter((s, i, all) => all.findIndex((x) => x.href === s.href) === i)
    .sort((a, b) => Date.parse(b.date ?? '') - Date.parse(a.date ?? ''))
    .slice(0, FEATURED_SIZE);
  const [live, setLive] = useState<Story[] | null>(null);

  useEffect(() => {
    if (!articlesEnabled) return;
    let active = true;
    Promise.all([fetchArticles({ tags: ['trending'], limit: FEATURED_SIZE }), fetchArticles({ limit: FEATURED_SIZE })]).then(
      ([trending, newest]) => {
        const picked = [...trending.items, ...newest.items].filter((a, i, all) => all.findIndex((x) => x.slug === a.slug) === i).slice(0, FEATURED_SIZE);
        if (active && picked.length) setLive(picked.map(fromArticle));
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, []);

  const stories = live ?? builtIn;
  if (stories.length === 0) return null;
  return (
    <section className={styles.featured}>
      <div className={`${strip.strip} ${styles.featuredStrip}`}>
        {stories.map((s, i) => (
          <Link key={s.href} className={`${strip.stripCard} ${styles.featuredCard}`} href={s.href}>
            {s.image && <Image className={strip.stripImage} src={s.image} alt="" fill sizes="(max-width: 767px) 100vw, 680px" priority={i === 0} />}
            <span className={strip.stripBody}>
              <span className={`${strip.badge} ${strip.badgeStrip}`}>FEATURED</span>
              {s.topic && <span className={strip.stripProvider}>{s.topic}</span>}
              <span className={strip.stripTitle}>{s.title}</span>
              <span className={strip.stripFoot}>
                <span>{metaLine(s)}</span>
                <span className={strip.stripCta}>Read More</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * A category's section: its heading and line, its newest four stories and "View All N" (its page). The built-in posts
 * show until the live articles load; a category without any has no section.
 */
export function TopicSection({ section }: { section: HubSection }) {
  const { category } = section;
  const name = ARTICLE_CATEGORIES.find((c) => c.slug === category)?.name ?? section.title;
  const [live, setLive] = useState<{ category: string; stories: Story[]; total: number } | null>(null);

  useEffect(() => {
    if (!category || !articlesEnabled) return;
    let active = true;
    fetchArticles({ category, limit: SECTION_SIZE }).then(
      (r) => active && setLive({ category, stories: r.items.map(fromArticle), total: r.total }),
      () => {},
    );
    return () => {
      active = false;
    };
  }, [category]);

  const shown = live && live.category === category ? live : null;
  const stories = shown ? shown.stories : section.posts.slice(0, SECTION_SIZE).map((p) => fromPost(p, category));
  if (stories.length === 0) return null;
  return (
    <section className={styles.topic}>
      <div className={styles.topicHead}>
        <h2 className={styles.topicTitle}>{name}</h2>
        {category && updatesTopics[category] && <span className={styles.topicDesc}>{updatesTopics[category].desc}</span>}
      </div>
      {/* The article lists' cards: the date on the photo, then "6 min read | By Compete Like Pros". */}
      <div className={styles.topicGrid}>
        {stories.map((s) => (
          <ArticleCard key={s.href} post={storyCard({ ...s, readingTime: s.read })} eager={false} />
        ))}
      </div>
      <Link className={styles.viewAll} href={section.href}>
        View All{shown ? ` ${shown.total}` : ''}{' '}
        <span className="glyph" aria-hidden>
          →
        </span>
      </Link>
    </section>
  );
}
