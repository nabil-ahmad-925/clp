/* eslint-disable @next/next/no-img-element -- the video site's own picture, shown as it is. */
import { albumTypeName } from '@/content/albums';
import type { PartnerVideo } from '@/content/partnerPages';
import { titleCase } from '../page/titleCase';
import { VIDEO_SOURCES, thumbOf } from '../page/videos';
import s from '../partnerPage.module.css';

/** A YouTube video: its picture and play mark; it plays in the page. */
export default function VideoCard({ video, title, mono, onPlay }: { video: PartnerVideo; title: string; mono: string; onPlay: () => void }) {
  const thumb = thumbOf(video);
  return (
    <button type="button" className={s.contentCard} onClick={onPlay}>
      <span className={s.contentMedia}>
        {thumb ? <img src={thumb} alt="" loading="lazy" /> : <span className={s.videoBlank}>{mono}</span>}
        <span className={s.contentSource} style={{ background: VIDEO_SOURCES.youtube.bg }}>
          {VIDEO_SOURCES.youtube.label}
        </span>
        <span className={s.playMark} aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#111111">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
      <span className={s.contentText}>
        <strong>{titleCase(title)}</strong>
        {/* Its category, and who posted it when it was shared to this page. */}
        <span>{[albumTypeName(video.category) || 'Video', video.from ? `From ${video.from.name}` : 'YouTube'].join(' · ')}</span>
      </span>
    </button>
  );
}
