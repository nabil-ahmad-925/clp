'use client';

import { useEffect } from 'react';
import { logNoResult } from '@/content/sourcing';

const SETTLE_MS = 1200;

/**
 * Counts a Wholesale search that found nothing for CLP's Sourcing requests ("Searched with no result"): only once the
 * catalog is in and the search has stayed put a moment (not every letter typed), and once per search in this tab.
 */
export function useNoResultLog(q: string, empty: boolean, loaded: boolean) {
  useEffect(() => {
    if (!loaded || !empty || q.trim().length < 2) return;
    const t = window.setTimeout(() => void logNoResult(q), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [q, empty, loaded]);
}
