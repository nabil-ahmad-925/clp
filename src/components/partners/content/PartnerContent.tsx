'use client';

import { useState } from 'react';
import type { LiveAlbum } from '@/content/albums';
import type { PartnerPageData, PartnerVideo } from '@/content/partnerPages';
import s from '../partnerPage.module.css';
import AlbumCard from './AlbumCard';
import PhotoCard from './PhotoCard';
import PhotoViewer from './PhotoViewer';
import VideoCard from './VideoCard';
import { photosAtoZ } from './photos';

type Kind = 'all' | 'albums' | 'photos' | 'videos';
type Props = { page: PartnerPageData; albums: LiveAlbum[]; videos: PartnerVideo[]; onVideo: (v: PartnerVideo) => void };

/** How many items the Content tab has: albums, the partner's own photos and their videos. */
export const contentCount = (page: PartnerPageData, albums: LiveAlbum[], videos: PartnerVideo[]) => albums.length + page.photos.length + videos.length;

/**
 * Content (the handoff's "Photos & videos"): the partner's photo albums (each opens its gallery page), their own photos
 * (My page in the admin, A to Z, each opening large here) and their YouTube videos (played in the page). All, Albums,
 * Photos and Videos filter them.
 */
export default function PartnerContent({ page, albums, videos, onVideo }: Props) {
  const [kind, setKind] = useState<Kind>('all');
  const [open, setOpen] = useState<number | null>(null);
  const photos = photosAtoZ(page.photos, page.short);
  const filters: [Kind, string, number][] = [
    ['all', 'All', albums.length + photos.length + videos.length],
    ['albums', 'Albums', albums.length],
    ['photos', 'Photos', photos.length],
    ['videos', 'Videos', videos.length],
  ];
  const shows = (k: Kind) => kind === 'all' || kind === k;
  const none = filters.find(([id]) => id === kind)?.[2] === 0;
  const what = kind === 'all' ? 'content' : kind;
  return (
    <div className={s.stack}>
      <div className={s.sectionHead}>
        <h2 className={s.cardTitle}>Photos &amp; Videos</h2>
        <div className={s.pills}>
          {filters.map(([id, label, n]) => (
            <button key={id} type="button" className={`${s.pill} ${kind === id ? s.pillOn : ''}`} aria-pressed={kind === id} onClick={() => setKind(id)}>
              {label} <span>{n}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={s.grid3}>
        {shows('albums') && albums.map((a) => <AlbumCard key={a.id} album={a} mono={page.mono} />)}
        {shows('photos') && photos.map((p, i) => <PhotoCard key={`${p.photo.src}-${i}`} photo={p.photo} title={p.title} onOpen={() => setOpen(i)} />)}
        {shows('videos') &&
          videos.map((v, i) => <VideoCard key={v.id ?? `v-${i}-${v.url}`} video={v} title={v.title || `${page.short} video ${i + 1}`} mono={page.mono} onPlay={() => onVideo(v)} />)}
      </div>
      {none && <div className={s.emptyCard}>{kind === 'all' ? `Nothing from ${page.short} yet.` : `No ${what} from ${page.short} yet.`}</div>}
      <div className={s.note}>Youth albums and videos are private to the families booked on that session. Download, print or license a photo from any public album.</div>
      {open !== null && photos[open] && <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}
