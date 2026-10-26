/* eslint-disable @next/next/no-img-element -- the partner's photos are their own uploads (the media bucket), shown as they are. */
import Link from 'next/link';
import { albumDates, type LiveAlbum } from '@/content/albums';
import { titleCase } from '../page/titleCase';
import s from '../partnerPage.module.css';

/** An album: its cover (blurred while private), public or private, how many photos; it opens its gallery page. */
export default function AlbumCard({ album, mono }: { album: LiveAlbum; mono: string }) {
  return (
    <Link href={`/photos/?album=${encodeURIComponent(album.id)}`} className={s.contentCard}>
      <span className={s.contentMedia}>
        {album.cover ? (
          <img src={album.cover} alt="" loading="lazy" />
        ) : album.preview ? (
          <img src={album.preview} alt="" className={s.contentLocked} />
        ) : (
          <span className={s.videoBlank}>{mono}</span>
        )}
        <span className={s.contentSource}>{album.access === 'public' ? 'ALBUM' : 'PRIVATE'}</span>
        <span className={s.contentBadge}>
          {album.count} {album.count === 1 ? 'photo' : 'photos'}
        </span>
      </span>
      <span className={s.contentText}>
        <strong>{titleCase(album.name)}</strong>
        <span>{['Album', albumDates(album), album.city].filter(Boolean).join(' · ')}</span>
      </span>
    </Link>
  );
}
