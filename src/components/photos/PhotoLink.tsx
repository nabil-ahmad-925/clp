'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import PageHero from '@/components/sections/PageHero';
import PhotoGate from '@/components/sections/PhotoGate';
import Section from '@/components/ui/Section';
import { MyAlbums } from './PhotoExplorer';
import PhotoAlbumPage from './PhotoAlbumPage';
import PhotosHome from './PhotosHome';

/**
 * /photos/ is Find your game photos (PhotosHome); /photos/?album=<id> is the album and /photos/?album=<id>&photo=<id>
 * one of its photos (PhotoAlbumPage); /photos/?code=<code> opens a private album with its code (the gate tries it at
 * once, then goes to the album); /photos/?signin=1 (the photo login's invitation e-mail) is its sign-in, then the
 * albums it was added to.
 */
export default function PhotoLink() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('album') ?? '';
  const photo = params.get('photo') ?? '';
  const code = params.get('code') ?? '';
  const signin = params.get('signin') !== null;

  if (id) return <PhotoAlbumPage key={id} id={id} photoId={photo} />;
  if (!code && !signin) return <PhotosHome />;
  return (
    <>
      <PageHero title={['Photos']} height={350} backgroundColor="#0a0a0a" />
      <Section style={{ padding: '60px 0 80px' }}>
        {signin ? (
          <MyAlbums />
        ) : (
          <PhotoGate kind="code" initialCode={code} onUnlocked={(album) => router.replace(`/photos/?album=${encodeURIComponent(album.id)}`)} />
        )}
      </Section>
    </>
  );
}
