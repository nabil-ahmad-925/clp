'use client';

import { useCallback, useEffect, useState } from 'react';
import { getLink, savedKey, saveKey, unlockLink, type PublicLink } from '@/content/links';

/** A share link by its page and link slug, with the key of a private one (remembered for this visit) and a way to open it. */
export function useLink(page: string, link: string) {
  const [data, setData] = useState<PublicLink | null>(null);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(
    (k: string) =>
      getLink(page, link, k).then(
        (l) => (setData(l), setKey(k), setError('')),
        (err) => setError(err instanceof Error ? err.message : 'Could not load this link.'),
      ),
    [page, link],
  );
  useEffect(() => {
    void load(savedKey(page, link));
  }, [load, page, link]);

  /** Opens a private link with its password or an invited email; rejects with the message to show. */
  const unlock = async (secret: { password?: string; email?: string }) => {
    const k = await unlockLink(page, link, secret);
    saveKey(page, link, k);
    await load(k);
  };
  return { data, key, error, unlock };
}
