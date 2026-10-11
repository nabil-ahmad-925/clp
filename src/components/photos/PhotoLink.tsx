'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PageHero from '@/components/sections/PageHero';
import PhotoGate from '@/components/sections/PhotoGate';
import Section from '@/components/ui/Section';
import { albumsEnabled, fetchAlbum, liveAlbumHref } from '@/content/albums';

/**
 * /photos/?album=<id> goes to the album on its sport's photo page; /photos/?code=<code> opens a private album with its
 * code (the gate tries it at once, then goes to the album).
 */
export default function PhotoLink() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('album') ?? '';
  const code = params.get('code') ?? '';
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id || !albumsEnabled) return;
    let active = true;
    fetchAlbum(id).then(
      (r) => {
        if (!active) return;
        if (r.status === 'missing') setMissing(true);
        else router.replace(liveAlbumHref(r.item));
      },
      () => active && setMissing(true),
    );
    return () => {
      active = false;
    };
  }, [id, router]);

  return (
    <>
      <PageHero title={['Photos']} height={350} backgroundColor="#0a0a0a" />
      <Section style={{ padding: '60px 0 80px' }}>
        {id && !missing ? (
          <p style={{ textAlign: 'center' }}>Opening the album…</p>
        ) : id ? (
          <p style={{ textAlign: 'center' }}>
            This album isn&rsquo;t available (it may have closed). <Link href="/experiences/">See Experiences</Link>
          </p>
        ) : (
          <PhotoGate kind="code" initialCode={code} />
        )}
      </Section>
    </>
  );
}
