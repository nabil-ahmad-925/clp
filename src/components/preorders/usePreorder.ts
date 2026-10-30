'use client';

import { useEffect, useState } from 'react';
import { getPreorder, type PublicPreorder } from '@/content/preorders';

/** A pre-order by its id, or the message to show when it can't be loaded. */
export function usePreorder(id: string) {
  const [preorder, setPreorder] = useState<PublicPreorder | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    getPreorder(id).then(
      (p) => live && setPreorder(p),
      (err) => live && setError(err instanceof Error ? err.message : 'Could not load this pre-order.'),
    );
    return () => {
      live = false;
    };
  }, [id]);
  return { preorder, error };
}
