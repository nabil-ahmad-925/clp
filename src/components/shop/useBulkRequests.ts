'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { onCartIdChange } from '@/content/cart';
import { guestRequests, myDesigns, type BulkRequest } from '@/content/bulk';

/**
 * The partner's or guest's requests (saved designs, quotes, orders), loaded again when they sign in or out, when the
 * browser's cart changes (a guest's requests are kept under it, and signing in moves them to the account's cart: the
 * switch can finish after the first load), and when they come back to the tab (CLP's desk moves them on meanwhile).
 * Only the latest load counts, so a slow answer for the old cart never replaces the new one.
 */
export function useBulkRequests(partner: boolean, ready: boolean) {
  const [items, setItems] = useState<BulkRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  // The last load failed: the list may be missing requests, so it says so (never "No quote requests yet").
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  const reload = useCallback(() => {
    const n = ++latest.current;
    (partner ? myDesigns() : guestRequests()).then(
      (list) => n === latest.current && (setItems(list), setFailed(false), setLoaded(true)),
      // Keeps what it already had: a failed refresh doesn't wipe the list.
      () => n === latest.current && (setFailed(true), setLoaded(true)),
    );
  }, [partner]);
  useEffect(() => {
    if (!ready) return;
    reload();
    const again = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', again);
    window.addEventListener('focus', again);
    const stop = onCartIdChange(reload);
    return () => {
      document.removeEventListener('visibilitychange', again);
      window.removeEventListener('focus', again);
      stop();
    };
  }, [ready, reload]);
  return { items, setItems, reload, loaded, failed };
}
