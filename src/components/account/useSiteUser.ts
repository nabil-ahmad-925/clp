'use client';

import { useSyncExternalStore } from 'react';
import { onPartnerSession, partnerSessionSnapshot, userFromSnapshot } from '@/content/partnerSession';

/** Who's signed in on the site (a member, a partner or CLP), or null; follows sign-ins and sign-outs in any tab. */
export function useSiteUser() {
  return userFromSnapshot(useSyncExternalStore(onPartnerSession, partnerSessionSnapshot, () => ''));
}
