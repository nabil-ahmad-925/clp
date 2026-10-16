'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { fetchMyPartnerPage, isStudioUser, onPartnerSession, partnerSessionSnapshot, uploadImage, userFromSnapshot, type BrandKit, type PartnerUser } from '@/content/partnerSession';

/** The design studio's brand: the partner's kit (colours, logos, guidelines), and the logo and colour they work with. */
export type StudioBrand = {
  user: PartnerUser | null;
  /** A partner (or teammate, or CLP) signed in: the studio, mockups and saved designs are theirs. */
  partner: boolean;
  name: string;
  kit: BrandKit;
  logo: string;
  color: string;
  setLogo: (url: string) => void;
  setColor: (c: string) => void;
  upload: (file: File) => Promise<string>;
  loading: boolean;
};

const EMPTY_KIT: BrandKit = { colors: [], logos: [], locked: false, manager: '', fonts: [], patterns: [], places: [], phrases: [] };
const PREFS = 'clp-studio-prefs';
const DEFAULT_COLOR = '#0B2A5B';

const readPrefs = (): { logo?: string; color?: string } => {
  try {
    return JSON.parse(localStorage.getItem(PREFS) ?? '{}') ?? {};
  } catch {
    return {};
  }
};
const writePrefs = (p: { logo?: string; color?: string }) => {
  try {
    localStorage.setItem(PREFS, JSON.stringify({ ...readPrefs(), ...p }));
  } catch {
    // Storage blocked: kept for this page.
  }
};

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
  const [prefs, setPrefs] = useState<{ logo?: string; color?: string }>(() => (typeof window === 'undefined' ? {} : readPrefs()));
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

  const setLogo = useCallback((url: string) => {
    setPrefs((p) => ({ ...p, logo: url }));
    writePrefs({ logo: url });
  }, []);
  const setColor = useCallback((c: string) => {
    setPrefs((p) => ({ ...p, color: c }));
    writePrefs({ color: c });
  }, []);
  const upload = useCallback(async (file: File) => uploadImage(await asUploadable(file)), []);

  return { user, partner, name: mine?.name ?? '', kit, logo, color, setLogo, setColor, upload, loading: partner && !mine };
}
