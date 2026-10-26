import type { PartnerPageData } from '@/content/partnerPages';
import { titleCase } from '../page/titleCase';

export type PagePhoto = PartnerPageData['photos'][number];

/** The partner's photos A to Z by caption (those without one last, in their order), each with the title it shows (in Title Case). */
export function photosAtoZ(photos: PagePhoto[], short: string) {
  const named = photos.filter((p) => p.caption.trim()).sort((a, b) => a.caption.trim().localeCompare(b.caption.trim(), 'en', { sensitivity: 'base' }));
  const unnamed = photos.filter((p) => !p.caption.trim());
  return [...named, ...unnamed].map((photo, i) => ({ photo, title: titleCase(photo.caption.trim()) || `${short} Photo ${i + 1 - named.length}` }));
}
