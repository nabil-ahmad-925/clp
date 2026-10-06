import type { Metadata } from 'next';
import { Suspense } from 'react';
import ArticleRoute from '@/components/pages/ArticleRoute';

// Articles written in the admin after the site was built: /article/?slug=<slug> (a static export has no page per
// article, so the slug is in the query and the article is fetched in the browser). The original site's posts keep
// their own addresses (/<slug>/).
export const metadata: Metadata = {
  title: { absolute: 'Article - Compete Like Pros™' },
};

export default function ArticlePage() {
  return (
    <Suspense>
      <ArticleRoute />
    </Suspense>
  );
}
