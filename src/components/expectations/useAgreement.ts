'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { accountAgreement, agree, agreementFromSnapshot, agreementSnapshot, onAgreementChange, type Agreement } from '@/content/expectationsAgreement';
import type { Audience } from '@/content/expectationsRoles';
import { useSiteUser } from '@/components/account/useSiteUser';

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; message: string };

/**
 * The reader's agreement to this version (the account's when signed in, else this browser's) and "I agree". `role` is
 * where the "I'm a" switch starts: the agreement's role, else a partner-side account's "partner", else "player".
 */
export function useAgreement() {
  const user = useSiteUser();
  const userId = user?.userId ?? '';
  const inBrowser = agreementFromSnapshot(useSyncExternalStore(onAgreementChange, agreementSnapshot, () => ''));
  // The account's, with whose it is (a sign-in or sign-out meanwhile never shows someone else's).
  const [onAccount, setOnAccount] = useState<{ userId: string; agreement: Agreement | null } | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    if (!userId) return;
    let live = true;
    // Not loaded (offline, signed out meanwhile): they can agree again, which keeps the same record.
    accountAgreement().then(
      (agreement) => live && setOnAccount({ userId, agreement }),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [userId]);

  const agreement = userId ? (onAccount?.userId === userId ? onAccount.agreement : null) : inBrowser;
  const partnerSide = Boolean(user?.access?.kind && user.access.kind !== 'member');
  const role: Audience = agreement?.role ?? (partnerSide ? 'partner' : 'player');

  const confirm = async (as: Audience) => {
    setStatus({ kind: 'saving' });
    try {
      const saved = await agree(as);
      if (userId) setOnAccount({ userId, agreement: saved });
      setStatus({ kind: 'idle' });
      return true;
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error && err.message ? err.message : 'The agreement wasn’t saved. Try again.' });
      return false;
    }
  };

  return { agreement, role, status, confirm };
}
