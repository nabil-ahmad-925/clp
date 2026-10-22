'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { fetchSoldOut, isBookable, type SavedPlace } from '@/content/listings';
import type { DirectoryItem } from '@/content/types';

const subscribe = (fn: () => void) => {
  window.addEventListener('clp-waitlists', fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener('clp-waitlists', fn);
    window.removeEventListener('storage', fn);
  };
};
// The saved places as one string (a stable snapshot), parsed by the hook.
const snapshot = () => {
  try {
    return localStorage.getItem('clp-waitlists') ?? '{}';
  } catch {
    return '{}';
  }
};

/**
 * The cards' waitlists: which of these listings are sold out with their waitlist open (people waiting), and the places
 * this device joined ("<widgetId>.<id>"). Only listings booked on CLP (see isBookable) with a waitlist are asked about.
 */
export function useWaitlists(items: DirectoryItem[], widgetOf: (item: DirectoryItem) => number | string | undefined) {
  const asked = items.filter((i) => i.waitlist && i.capacity && isBookable(i));
  const key = asked.map((i) => `${widgetOf(i)}.${i.id}`).join(',');
  const [soldOut, setSoldOut] = useState<Record<string, { waiting: number }>>({});
  useEffect(() => {
    if (!key) return;
    let active = true;
    fetchSoldOut(key.split(',').map((k) => ({ widgetId: k.split('.')[0], id: k.slice(k.indexOf('.') + 1) }))).then((r) => active && setSoldOut(r));
    return () => {
      active = false;
    };
  }, [key]);
  const saved = useSyncExternalStore(subscribe, snapshot, () => '{}');
  let places: Record<string, SavedPlace> = {};
  try {
    places = JSON.parse(saved) as Record<string, SavedPlace>;
  } catch {
    // A damaged entry: nothing saved.
  }
  return { soldOut: key ? soldOut : {}, places };
}
