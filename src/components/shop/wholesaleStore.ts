'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { WS_ASSETS, type WsAsset } from '@/content/wholesale';

/**
 * Wholesale's state in this browser (the board's prototype state, kept until the API has brand assets and favorites):
 * the logo every mockup uses, the item colour, Show mockups, this browser's uploads (new art, waiting for approval),
 * and favorite folders. Every page using it updates together.
 */
export type WsFolder = { id: string; name: string };
export type WsState = { lg: string; ic: string; mock: boolean; ups: WsAsset[]; folders: WsFolder[]; favs: Record<string, string[]> };

const KEY = 'clp-wholesale';
const EVENT = 'clp-wholesale-change';
const DEFAULTS: WsState = {
  lg: 'crest',
  ic: '#7A1F2B',
  mock: true,
  ups: [],
  folders: [
    { id: 'f1', name: 'Spring season kits' },
    { id: 'f2', name: 'Pro Day staff & volunteers' },
    { id: 'f3', name: 'Fundraiser ideas' },
  ],
  favs: { 'ad-jersey': ['f1'], 'ad-short': ['f1'], 'cs-socks': ['f1'], 'nb-qz': ['f2'], 'ua-polo': ['f2'], tent: ['f2'], bottle: ['f3'], 'ch-hood': ['f3'] },
};
/** Uploads kept in this browser (images as data URLs or links): the newest few. */
const MAX_UPLOADS = 8;

const read = (): string => {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
};
const parse = (raw: string): WsState => {
  try {
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<WsState>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};
const subscribe = (fn: () => void) => {
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('storage', fn);
  };
};

export function useWholesale() {
  const raw = useSyncExternalStore(subscribe, read, () => '');
  const state = useMemo(() => parse(raw), [raw]);
  const update = useCallback((patch: Partial<WsState> | ((s: WsState) => Partial<WsState>)) => {
    const cur = parse(read());
    const next = { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) };
    next.ups = next.ups.slice(-MAX_UPLOADS);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage full (a big upload): keep the newest uploads only.
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...next, ups: next.ups.slice(-2) }));
      } catch {
        // Storage blocked: nothing is kept.
      }
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const assets = useMemo(() => [...WS_ASSETS, ...state.ups], [state.ups]);
  const asset = useCallback((id: string) => assets.find((a) => a.id === id), [assets]);
  /** Adds an upload (new art, waiting for approval) and uses it. */
  const addUpload = useCallback((a: WsAsset) => update((s) => ({ ups: [...s.ups.filter((u) => u.id !== a.id), a], lg: a.id, mock: true })), [update]);
  const isFav = useCallback((id: string) => (state.favs[id] ?? []).length > 0, [state.favs]);
  return { ...state, assets, asset, update, addUpload, isFav };
}
export type Wholesale = ReturnType<typeof useWholesale>;

/** An upload as a new asset: its name from the file, its pixels' width once read (for the print check). */
export async function uploadAsset(file: File, src: string): Promise<WsAsset> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  const px = await new Promise<number>((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im.naturalWidth);
    im.onerror = () => resolve(0);
    im.src = src;
  });
  return { id: `up${Date.now()}`, name: file.name.replace(/\.[^.]+$/, '').slice(0, 16) || 'My upload', kind: 'img', src, status: 'new', vector: ext === 'svg', px };
}
