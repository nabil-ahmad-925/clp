'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { articlesEnabled, categoryOfArchive, fetchArticles, toArchivePost } from '@/content/articles';
import type { CategoryArchive } from '@/content/categories';
import CategoryArchiveView from './CategoryArchiveView';

/** Posts per archive page (as on the original site). */
const PAGE_SIZE = 10;
/** The API's last page number. */
const MAX_PAGE = 200;

/**
 * What an archive lists and its first page's address: a category's articles, or an author's. The original author
 * pages /author/<slug>/page/<n>/ are page n of /author/<slug>/.
 */
function sourceOf(path: string) {
  const category = categoryOfArchive(path);
  if (category) return { query: { category }, base: path, page: 1 };
  const m = path.match(/^(\/author\/([a-z0-9-]+)\/)(?:page\/(\d+)\/)?$/);
  return m ? { query: { author: m[2] }, base: m[1], page: Number(m[3] ?? 1) } : null;
}

/** Page links: Previous, the first and last pages, the current one and its neighbours (gaps as "…"), Next. */
function pagination(base: string, page: number, pages: number): CategoryArchive['pagination'] {
  if (pages < 2) return undefined;
  const at = (n: number) => (n === 1 ? base : `${base}?page=${n}`);
  const shown = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const numbers = shown.flatMap((n, i) => [
    ...(i > 0 && n - shown[i - 1] > 1 ? [{ label: '…', kind: 'gap' as const }] : []),
    { label: String(n), href: n === page ? undefined : at(n), kind: 'page' as const },
  ]);
  return [
    ...(page > 1 ? [{ label: 'Previous', href: at(page - 1), kind: 'prev' as const }] : []),
    ...numbers,
    ...(page < pages ? [{ label: 'Next', href: at(page + 1), kind: 'next' as const }] : []),
  ];
}

/**
 * A category or author archive listing the live articles (as published in the admin), newest first, PAGE_SIZE a page
 * (?page=n; a page past the last one goes to the last). The built-in list shows until they load when it is the same
 * page, and if the API can't be reached.
 */
export default function LiveArchive({ archive }: { archive: CategoryArchive }) {
  const router = useRouter();
  const source = sourceOf(archive.path);
  const requested = Number(useSearchParams().get('page'));
  const page = Math.min(MAX_PAGE, Number.isInteger(requested) && requested > 1 ? requested : (source?.page ?? 1));
  const key = `${archive.path}|${page}`;
  const [live, setLive] = useState<{ key: string; archive: CategoryArchive | null } | null>(null);

  useEffect(() => {
    const source = sourceOf(archive.path);
    if (!source || !articlesEnabled) return;
    let active = true;
    const key = `${archive.path}|${page}`;
    fetchArticles({ ...source.query, limit: PAGE_SIZE, page }).then(
      (r) => {
        if (!active) return;
        // Past the last page (an old link, or articles removed meanwhile): the last page.
        if (r.page > r.pages && r.total > 0) return router.replace(r.pages > 1 ? `${source.base}?page=${r.pages}` : source.base);
        setLive({ key, archive: { ...archive, posts: r.items.map(toArchivePost), pagination: pagination(source.base, r.page, r.pages) } });
      },
      // Not reachable: the built-in list.
      () => active && setLive({ key, archive: null }),
    );
    return () => {
      active = false;
    };
  }, [archive, page, router]);

  if (live?.key === key) return <CategoryArchiveView archive={live.archive ?? archive} />;
  // Loading: the built-in list when it is this page, otherwise the header alone.
  return <CategoryArchiveView archive={page === (source?.page ?? 1) ? archive : { ...archive, posts: [], pagination: undefined }} />;
}
