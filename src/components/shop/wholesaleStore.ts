'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { WS_ASSETS, loadWholesale, type WsAsset, type WsCatalog } from '@/content/wholesale';

/**
 * Wholesale's state in this browser: the logo every mockup uses, the item colour, Show mockups, this browser's uploads
 * (new art, waiting for approval), and favorite folders (a signed-in account's are saved to it too, see
 * favoritesSync.ts). Every page using it updates together.
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
  folders: [{ id: 'f1', name: 'My favorites' }],
  favs: {},
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

/** This browser's Wholesale state now. */
export const readWholesale = () => parse(read());

/** Changes this browser's Wholesale state (every page using it updates). */
export function patchWholesale(patch: Partial<WsState> | ((s: WsState) => Partial<WsState>)) {
  const cur = readWholesale();
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
}

/** Calls `fn` after every change made in this tab (not another tab's: that tab saves its own). */
export function onWholesaleChange(fn: () => void) {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

/** A guest's favorites before they save any: one empty folder. */
export const NO_FAVORITES: Pick<WsState, 'folders' | 'favs'> = { folders: DEFAULTS.folders, favs: DEFAULTS.favs };

export function useWholesale() {
  const raw = useSyncExternalStore(subscribe, read, () => '');
  const state = useMemo(() => parse(raw), [raw]);
  const update = useCallback((patch: Partial<WsState> | ((s: WsState) => Partial<WsState>)) => patchWholesale(patch), []);
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

/** The live Wholesale catalog (clp-api GET /wholesale/catalog): null while it loads; `failed` and `retry` when it couldn't. */
export function useWholesaleCatalog() {
  const [data, setData] = useState<WsCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    loadWholesale().then(
      (c) => {
        if (!live) return;
        setData(c);
        setFailed(false);
      },
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [attempt]);
  return { data, failed, retry: () => setAttempt((n) => n + 1) };
}
