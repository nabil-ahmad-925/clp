'use client';

import { useSyncExternalStore } from 'react';

/**
 * The partner pages this browser subscribed to (their Unsubscribe and what was picked), so the page shows
 * "✓ Subscribed" and its confirmation. The subscription itself lives with the API. Cleared on sign-out
 * (account/syncAccount.ts), so the next person here doesn't see it.
 */
export type SavedSubscription = { contact: string; token: string; topics: string[]; channels: ('email' | 'sms')[]; childName: string };
const KEY = 'clp-subscriptions';
const EVENT = 'clp-subscriptions';
// The last write, for when storage is blocked (subscribed for this visit only).
let memory = '';

const snapshot = () => {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return memory;
  }
};

function readAll(): Record<string, SavedSubscription> {
  try {
    const raw: unknown = JSON.parse(snapshot() || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, SavedSubscription>) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, SavedSubscription>) {
  memory = Object.keys(all).length ? JSON.stringify(all) : '';
  try {
    if (memory) localStorage.setItem(KEY, memory);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: `memory` keeps it for this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function saveSubscription(slug: string, sub: SavedSubscription) {
  writeAll({ ...readAll(), [slug]: sub });
}

export function forgetSubscription(slug: string) {
  const all = readAll();
  delete all[slug];
  writeAll(all);
}

/** Signing out: this browser forgets them all. */
export const forgetSubscriptions = () => writeAll({});

function subscribe(fn: () => void) {
  const storage = (e: StorageEvent) => e.key === KEY && fn();
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('storage', storage);
  };
}

/** This page's saved subscription, or null; follows changes in any tab. */
export function useSavedSubscription(slug: string): SavedSubscription | null {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '');
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as Record<string, SavedSubscription>)[slug] ?? null;
  } catch {
    return null;
  }
}
