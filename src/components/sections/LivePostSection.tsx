'use client';

import { useEffect, useState } from 'react';
import { articlesEnabled, fetchArticles, toPost } from '@/content/articles';
import type { Post, PostSectionData } from '@/content/types';
import PostSection from './PostSection';

/**
 * An "Updates & News" section listing its category's newest live articles (as published in the admin), as many as the
 * design's section shows (its built-in cards: 3 in a masonry row, 4–5 in a carousel); "View all" opens all of them.
 * The built-in cards show until they load (and stay if the API can't be reached); a category without articles has no
 * section.
 */
export default function LivePostSection({ category, ...section }: PostSectionData & { category?: string }) {
  const [live, setLive] = useState<{ category: string; posts: Post[] } | null>(null);
  const size = section.posts.length;

  useEffect(() => {
    if (!category || !articlesEnabled || size < 1) return;
    let active = true;
    fetchArticles({ category, limit: size }).then(
      (r) => active && setLive({ category, posts: r.items.map(toPost) }),
      () => {},
    );
    return () => {
      active = false;
    };
  }, [category, size]);

  const posts = live && live.category === category ? live.posts : section.posts;
  if (!posts.length) return null;
  // A new list re-creates the carousel (its slides and dots are measured once).
  return <PostSection key={posts.map((p) => p.href).join('|')} {...section} posts={posts} />;
}
