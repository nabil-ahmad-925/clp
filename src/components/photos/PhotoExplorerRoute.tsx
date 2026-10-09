'use client';

import { useSearchParams } from 'next/navigation';
import type { PhotoSection } from '@/content/photos';
import PhotoExplorer, { type PhotoView } from './PhotoExplorer';

/**
 * A sport's photo page reads its view from the address: ?category=<album slug> (a category's albums),
 * ?access=family|client (those gates), ?code=<code> (a private album's gate); otherwise the home. An album page is
 * always its album.
 */
export default function PhotoExplorerRoute(section: PhotoSection) {
  const params = useSearchParams();
  const category = params.get('category');
  const access = params.get('access');
  const code = params.get('code');
  const view: PhotoView = section.album
    ? { kind: 'album' }
    : code !== null
      ? { kind: 'gate', access: 'code', code }
      : access === 'family' || access === 'client'
        ? { kind: 'gate', access }
        : category && section.albums.some((a) => a.slug === category)
          ? { kind: 'category', slug: category }
          : { kind: 'home' };
  return <PhotoExplorer {...section} view={view} />;
}
