'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageHero from '@/components/sections/PageHero';
import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import { articlesEnabled, fetchArticle, toBlogPost } from '@/content/articles';
import type { BlogPost } from '@/content/types';
import PostView from './PostView';
import styles from './PostView.module.css';

/**
 * live: the article from the API; null: there is none (deleted or unpublished); undefined: not loaded yet.
 * failed: the API couldn't be reached (a built-in copy then stays; without one, the page offers to try again).
 */
type State = { slug: string; live?: BlogPost | null; failed?: boolean };

/**
 * A blog post page showing the live article (as last saved in the admin). A built-in post (`post`, from the original
 * site) shows at once and is replaced by its live version when that loads, or kept when the API can't be reached; a
 * new article (no built-in copy) shows a placeholder until then.
 */
export default function LivePost({ slug, post }: { slug: string; post?: BlogPost }) {
  const [state, setState] = useState<State>({ slug });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!slug || !articlesEnabled) return;
    let active = true;
    fetchArticle(slug).then(
      (data) => active && setState({ slug, live: data ? toBlogPost(data) : null }),
      () => active && setState({ slug, failed: true }),
    );
    return () => {
      active = false;
    };
  }, [slug, attempt]);

  const live = state.slug === slug ? state.live : undefined;
  const failed = state.slug === slug && Boolean(state.failed);
  const shown = live ?? (live === null ? null : post);

  // The tab title of an article without a page of its own (/article/?slug=…), or one edited since the build.
  useEffect(() => {
    if (live) document.title = live.meta.title;
  }, [live]);

  if (shown) return <PostView post={shown} />;
  if (failed) {
    return (
      <>
        <PageHero title={['Article']} height={350} backgroundColor="#0a0a0a" />
        <Section style={{ padding: '80px 0', textAlign: 'center' }}>
          <p style={{ marginBottom: 30 }}>This article couldn&apos;t be loaded. Check your connection and try again.</p>
          <button
            type="button"
            className={styles.retry}
            onClick={() => {
              setState({ slug });
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
        </Section>
      </>
    );
  }
  if (shown === undefined && slug && articlesEnabled) {
    return (
      <>
        <PageHero title={['']} height={550} backgroundColor="#2d2d2d" />
        <div className={styles.body} data-header-tone="dark">
          <div className={`${styles.article} ${styles.loading}`} aria-busy="true" aria-label="Loading the article">
            <span />
            <span />
            <span />
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHero title={['Article Not Found']} height={350} backgroundColor="#0a0a0a" />
      <Section style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ marginBottom: 30 }}>
          This article isn&apos;t available anymore. See the latest in <Link href="/updates/">Updates &amp; News</Link>.
        </p>
        <Button href="/updates/" color="dark">
          Updates &amp; News
        </Button>
      </Section>
    </>
  );
}
