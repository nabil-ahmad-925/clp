import type { PartnerVideo } from '@/content/partnerPages';

/** A partner's videos: each site's badge, the video's id on it, its player, and its picture. */
export const VIDEO_SOURCES: Record<string, { label: string; bg: string }> = {
  youtube: { label: 'YOUTUBE', bg: '#C4302B' },
  instagram: { label: 'INSTAGRAM', bg: '#8A3AB9' },
  tiktok: { label: 'TIKTOK', bg: '#111111' },
  vimeo: { label: 'VIMEO', bg: '#1A7FB5' },
};
/** A video's id on its site, from its link. */
export const videoId = (v: PartnerVideo) => {
  try {
    const url = new URL(v.url);
    const path = url.pathname.split('/').filter(Boolean);
    if (v.source === 'youtube') return url.hostname.endsWith('youtu.be') ? path[0] : (url.searchParams.get('v') ?? (['shorts', 'embed', 'live'].includes(path[0]) ? path[1] : ''));
    if (v.source === 'vimeo') return path.find((x) => /^\d+$/.test(x)) ?? '';
    if (v.source === 'tiktok') return path.includes('video') ? path[path.indexOf('video') + 1] : '';
    if (v.source === 'instagram') return ['p', 'reel', 'tv'].includes(path[0]) ? path[1] : '';
  } catch {
    return '';
  }
  return '';
};
/** The player that plays a video on the page (visitors stay on CLP), or '' when its link can't be played here. */
export const embedOf = (v: PartnerVideo) => {
  const id = videoId(v);
  if (!id) return '';
  return {
    youtube: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
    vimeo: `https://player.vimeo.com/video/${id}?autoplay=1`,
    tiktok: `https://www.tiktok.com/embed/v2/${id}`,
    instagram: `https://www.instagram.com/p/${id}/embed`,
    '': '',
  }[v.source];
};
export const thumbOf = (v: PartnerVideo) => v.thumb || (v.source === 'youtube' && videoId(v) ? `https://i.ytimg.com/vi/${videoId(v)}/hqdefault.jpg` : '');
