'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ARTICLE_CATEGORIES, articleDate, articlesEnabled, authorOf, fetchArticles, type ArticleSummary } from '@/content/articles';
import type { Post } from '@/content/types';
import { updatesTopics } from '@/content/updates';
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

/** "Compete Like Pros · June 26, 2026 · 6 min read" (what is known). */
const metaLine = (s: Story) => [s.author, s.date, s.read].filter(Boolean).join(' · ');
/** A card's line under its title: "June 26, 2026 | 6 min read" (what is known). */
const dateLine = (s: Story) => [s.date, s.read].filter(Boolean).join(' | ');

function Cover({ src, sizes, priority }: { src: string; sizes: string; priority?: boolean }) {
  return src ? <Image className={styles.coverImage} src={src} alt="" fill sizes={sizes} priority={priority} /> : null;
}

/**
 * The featured row: the lead story (large, title over the photo) and two more beside it. The stories tagged Trending,
 * newest first, topped up with the newest articles; the newest built-in posts until they load.
 */
export function FeaturedStories({ sections }: { sections: HubSection[] }) {
  const builtIn = sections
    .flatMap((s) => s.posts.map((p) => fromPost(p, s.category)))
    .filter((s, i, all) => all.findIndex((x) => x.href === s.href) === i)
    .sort((a, b) => Date.parse(b.date ?? '') - Date.parse(a.date ?? ''))
    .slice(0, 3);
  const [live, setLive] = useState<Story[] | null>(null);

  useEffect(() => {
    if (!articlesEnabled) return;
    let active = true;
    Promise.all([fetchArticles({ tags: ['trending'], limit: 3 }), fetchArticles({ limit: 3 })]).then(
      ([trending, newest]) => {
        const picked = [...trending.items, ...newest.items].filter((a, i, all) => all.findIndex((x) => x.slug === a.slug) === i).slice(0, 3);
        if (active && picked.length) setLive(picked.map(fromArticle));
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, []);

  const [lead, ...side] = live ?? builtIn;
  if (!lead) return null;
  return (
    <section className={styles.featured}>
      <Link className={styles.lead} href={lead.href}>
        <Cover src={lead.image} sizes="(max-width: 900px) 100vw, 900px" priority />
        <span className={styles.leadShade} aria-hidden />
        <span className={styles.leadText}>
          <span className={styles.leadKicker}>FEATURED{lead.topic ? ` · ${lead.topic}` : ''}</span>
          <span className={styles.leadTitle}>{lead.title}</span>
          {metaLine(lead) && <span className={styles.leadMeta}>{metaLine(lead)}</span>}
        </span>
      </Link>
      {side.length > 0 && (
        <div className={styles.side}>
          {side.map((s) => (
            <Link key={s.href} className={styles.sideStory} href={s.href}>
              <span className={styles.sideCover}>
                <Cover src={s.image} sizes="(max-width: 900px) 100vw, 440px" />
              </span>
              {s.topic && <span className={styles.kicker}>{s.topic}</span>}
              <span className={styles.storyTitle}>{s.title}</span>
              {dateLine(s) && <span className={styles.cardDate}>{dateLine(s)}</span>}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * A category's section: its heading and line, its newest four stories and "View all N" (its page). The built-in posts
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
      <div className={styles.topicGrid}>
        {stories.map((s) => (
          <Link key={s.href} className={styles.card} href={s.href}>
            <span className={styles.cardCover}>
              <Cover src={s.image} sizes="(max-width: 480px) 100vw, (max-width: 900px) 50vw, 320px" />
            </span>
            {s.author && <span className={styles.byline}>BY {s.author.toUpperCase()}</span>}
            <span className={styles.storyTitle}>{s.title}</span>
            {dateLine(s) && <span className={styles.cardDate}>{dateLine(s)}</span>}
          </Link>
        ))}
      </div>
      <Link className={styles.viewAll} href={section.href}>
        View all{shown ? ` ${shown.total}` : ''}{' '}
        <span className="glyph" aria-hidden>
          →
        </span>
      </Link>
    </section>
  );
}
