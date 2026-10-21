'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { fetchMyPartnerPage, isStudioUser, onPartnerSession, partnerSessionSnapshot, uploadImage, userFromSnapshot, type BrandKit, type PartnerUser } from '@/content/partnerSession';
import { site } from '@/content/site';

/**
 * The bulk items' brand: a partner's kit (colours, logos, guidelines), and the logo and colour they (or a guest) preview
 * every item with.
 */
export type StudioBrand = {
  user: PartnerUser | null;
  /** A partner (or teammate, or CLP) signed in: the studio, saved designs and partner pricing are theirs. */
  partner: boolean;
  name: string;
  kit: BrandKit;
  /** The logo: a partner's uploaded link, a guest's own image (a data URL kept in this browser) or the sample. */
  logo: string;
  color: string;
  setLogo: (url: string) => void;
  setColor: (c: string) => void;
  /** A partner's file uploaded (its link); a guest's made a small image kept in this browser. */
  upload: (file: File) => Promise<string>;
  /** The design's sample: the CLP logo on black. */
  trySample: () => void;
  loading: boolean;
};

const EMPTY_KIT: BrandKit = { colors: [], logos: [], locked: false, manager: '', fonts: [], patterns: [], places: [], phrases: [] };
/** A partner's and a guest's choices are kept apart (a guest's logo is a local image a partner's designs can't use). */
const PREFS = 'clp-studio-prefs';
const GUEST_PREFS = 'clp-studio-prefs-guest';
const DEFAULT_COLOR = '#0B2A5B';
export const SAMPLE_LOGO = site.logo.light;
const SAMPLE_COLOR = '#111111';
type Prefs = { logo?: string; color?: string };

const PREFS_EVENT = 'clp-studio-prefs';
/** What couldn't be stored (storage blocked, or full): kept for this visit. */
const unsaved: Record<string, Prefs> = {};

const readPrefs = (key: string): Prefs => {
  if (unsaved[key]) return unsaved[key];
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') ?? {};
  } catch {
    return {};
  }
};
const writePrefs = (key: string, p: Prefs) => {
  const next = { ...readPrefs(key), ...p };
  try {
    localStorage.setItem(key, JSON.stringify(next));
    delete unsaved[key];
  } catch {
    unsaved[key] = next;
  }
  window.dispatchEvent(new Event(PREFS_EVENT));
};
/** The stored choices (both kinds) as text: read after the page is built, so its first render matches the server's. */
const prefsSnapshot = () => JSON.stringify([readPrefs(PREFS), readPrefs(GUEST_PREFS)]);
const onPrefs = (fn: () => void) => {
  const storage = (e: StorageEvent) => (e.key === PREFS || e.key === GUEST_PREFS) && fn();
  window.addEventListener(PREFS_EVENT, fn);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(PREFS_EVENT, fn);
    window.removeEventListener('storage', storage);
  };
};

/** An image's data URL at most `limit` bytes: a PNG (logos keep their transparency), else WebP, made smaller until it fits. */
export async function imageDataUrl(source: Blob | string, max = 600, limit = 280_000): Promise<string> {
  const src = typeof source === 'string' ? source : URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Could not read that image. Try a PNG or JPG.'));
      im.src = src;
    });
    const w = img.naturalWidth || 600;
    const h = img.naturalHeight || 300;
    let scale = Math.min(1, max / Math.max(w, h));
    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      for (const [type, quality] of [['image/png', undefined], ['image/webp', 0.9]] as const) {
        const url = canvas.toDataURL(type, quality);
        // A browser without WebP answers a PNG: only a real WebP is tried.
        if (!url.startsWith(`data:${type};`)) continue;
        if (Math.ceil(((url.length - url.indexOf(',') - 1) * 3) / 4) <= limit) return url;
      }
      scale *= 0.75;
    }
    throw new Error('That image is too detailed to use. Try a simpler logo.');
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(src);
  }
}

/** A raster or SVG logo as a PNG the media uploads accept (SVG is drawn to a canvas first). */
async function asUploadable(file: File): Promise<Blob> {
  if (['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });
    const w = img.naturalWidth || 1200;
    const h = img.naturalHeight || 600;
    const scale = Math.min(1, 2000 / Math.max(w, h)) || 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale) || 1200;
    canvas.height = Math.round(h * scale) || 600;
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that file.'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The signed-in partner's studio brand, following sign-in and sign-out. */
export function useStudio(): StudioBrand {
  const raw = useSyncExternalStore(onPartnerSession, partnerSessionSnapshot, () => '');
  const user = useMemo(() => userFromSnapshot(raw), [raw]);
  const partner = isStudioUser(user);
  const key = partner ? PREFS : GUEST_PREFS;
  const prefsRaw = useSyncExternalStore(onPrefs, prefsSnapshot, () => '[{},{}]');
  const prefs: Prefs = useMemo(() => (JSON.parse(prefsRaw) as [Prefs, Prefs])[partner ? 0 : 1] ?? {}, [prefsRaw, partner]);
  // The partner's page (brand kit, name, logo, colour), loaded for the signed-in account.
  const [loaded, setLoaded] = useState<{ userId: string; kit: BrandKit; name: string; logo: string; colors: string[] } | null>(null);

  useEffect(() => {
    if (!partner || !user) return;
    let live = true;
    fetchMyPartnerPage().then(
      (page) => {
        if (!live) return;
        const kit = { ...EMPTY_KIT, ...(page.brand ?? {}) };
        setLoaded({
          userId: user.userId,
          kit,
          name: page.name ?? user.access?.partnerName ?? '',
          logo: kit.logos[0]?.src || page.logo || '',
          colors: kit.colors.length ? kit.colors : [page.color || DEFAULT_COLOR],
        });
      },
      () => live && setLoaded({ userId: user.userId, kit: EMPTY_KIT, name: user.access?.partnerName ?? user.name ?? '', logo: '', colors: [DEFAULT_COLOR] }),
    );
    return () => {
      live = false;
    };
  }, [partner, user]);

  const mine = partner && loaded && loaded.userId === user?.userId ? loaded : null;
  const kit = mine?.kit ?? EMPTY_KIT;
  // A locked brand uses its own logo and colours; otherwise what the partner last used, or their kit's.
  const logo = mine ? (kit.locked ? mine.logo : prefs.logo || mine.logo) : (prefs.logo ?? '');
  const color = mine ? (kit.locked && !mine.colors.includes(prefs.color ?? '') ? mine.colors[0] : prefs.color || mine.colors[0]) : (prefs.color ?? DEFAULT_COLOR);

  const save = useCallback((p: Prefs) => writePrefs(key, p), [key]);
  const setLogo = useCallback((url: string) => save({ logo: url }), [save]);
  const setColor = useCallback((c: string) => save({ color: c }), [save]);
  const trySample = useCallback(() => save({ logo: SAMPLE_LOGO, color: SAMPLE_COLOR }), [save]);
  const upload = useCallback(async (file: File) => (partner ? uploadImage(await asUploadable(file)) : imageDataUrl(file)), [partner]);

  return { user, partner, name: mine?.name ?? '', kit, logo, color, setLogo, setColor, upload, trySample, loading: partner && !mine };
}
