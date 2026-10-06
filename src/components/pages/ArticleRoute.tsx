'use client';

import { useSearchParams } from 'next/navigation';
import LivePost from './LivePost';

/** The article named by /article/?slug=<slug>. */
export default function ArticleRoute() {
  const slug = useSearchParams().get('slug')?.trim().toLowerCase() ?? '';
  return <LivePost key={slug} slug={/^[a-z0-9-]{1,120}$/.test(slug) ? slug : ''} />;
}
