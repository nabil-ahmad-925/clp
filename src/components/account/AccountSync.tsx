'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { saveFavorites } from '@/components/shop/favoritesSync';
import { onWholesaleChange } from '@/components/shop/wholesaleStore';
import { onPartnerSession, partnerSessionSnapshot, userFromSnapshot } from '@/content/partnerSession';
import { syncAccount } from './syncAccount';

/** Saved a moment after the last change. */
const SAVE_DELAY = 600;

/** On every page (the root layout): keeps this browser's cart and favorites with the signed-in account. Renders nothing. */
export default function AccountSync() {
  const userId = userFromSnapshot(useSyncExternalStore(onPartnerSession, partnerSessionSnapshot, () => ''))?.userId ?? '';

  useEffect(() => {
    void syncAccount(userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let timer = 0;
    const off = onWholesaleChange(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void saveFavorites(), SAVE_DELAY);
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, [userId]);

  return null;
}
