/* eslint-disable @next/next/no-img-element -- the partner's photos are their own uploads (the media bucket), shown as they are. */
import s from '../partnerPage.module.css';
import type { PagePhoto } from './photos';

/** One of the partner's own photos (My page in the admin): it opens large in the photo viewer. */
export default function PhotoCard({ photo, title, onOpen }: { photo: PagePhoto; title: string; onOpen: () => void }) {
  return (
    <button type="button" className={s.contentCard} onClick={onOpen} aria-label={`View ${title}`}>
      <span className={s.contentMedia}>
        <img src={photo.src} alt={photo.caption} loading="lazy" />
        <span className={s.contentSource}>PHOTO</span>
      </span>
      <span className={s.contentText}>
        <strong>{title}</strong>
        <span>Photo</span>
      </span>
    </button>
  );
}
