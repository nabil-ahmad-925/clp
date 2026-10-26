'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchPartnerPage, type PartnerPageResponse } from '@/content/partnerPages';
import PartnerPageView from './PartnerPageView';
import s from './partnerPage.module.css';

type State = { key: string; data?: PartnerPageResponse; error?: string; missing?: boolean };

/**
 * /partner/?p=<slug>[&preview=<token>]: a CLP Partner's page, fetched in the browser (the site is a static export and
 * pages go live from the admin).
 */
export default function PartnerRoute() {
  const params = useSearchParams();
  const slug = params.get('p') ?? '';
  const preview = params.get('preview');
  const key = `${slug}|${preview ?? ''}`;
  const [state, setState] = useState<State>({ key: '' });

  useEffect(() => {
    if (!slug) return;
    let active = true;
    fetchPartnerPage(slug, preview).then(
      (data) => {
        if (!active) return;
        setState({ key, data });
        document.title = `${data.page.name} - Compete Like Pros™`;
      },
      (err) => active && setState({ key, missing: err?.status === 404, error: err instanceof Error ? err.message : 'Could not load this page.' }),
    );
    return () => {
      active = false;
    };
  }, [slug, preview, key]);

  if (!slug || (state.key === key && state.missing)) {
    return (
      <div className={s.state} data-header-tone="dark">
        <h1 className={s.sectionTitle}>Partner not found</h1>
        <p className={s.muted}>This partner page isn’t available. It may not be live yet.</p>
        <Link href="/clp-partners/" className={`${s.btn} ${s.btnDark}`}>
          See All CLP Partners
        </Link>
      </div>
    );
  }
  if (state.key === key && state.data) return <PartnerPageView data={state.data} />;
  if (state.key === key && state.error) {
    return (
      <div className={s.state} data-header-tone="dark">
        <p>{state.error}</p>
        <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }
  return (
    <div data-header-tone="light">
      <div style={{ height: 420, background: '#0a0a0a' }} />
      <div className={s.wrap} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 48, paddingBottom: 120 }}>
        <div className={s.skeleton} style={{ height: 44, width: '60%' }} />
        <div className={s.skeleton} style={{ height: 220 }} />
      </div>
    </div>
  );
}
