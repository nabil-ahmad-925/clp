'use client';

import { useCallback, useState } from 'react';
import { MAX_PIECES, piecesOf, type Draft } from './preorderMath';

/** The pieces a buyer has picked so far: a quantity per item and size, never more than one order (or `max`) can hold. */
export function useDraft(initial: Draft = {}, max = MAX_PIECES) {
  const [draft, setDraft] = useState<Draft>(initial);
  const setQty = useCallback((key: string, qty: number) => {
    setDraft((d) => {
      const rest = { ...d };
      delete rest[key];
      const room = Math.min(max, MAX_PIECES) - piecesOf(rest);
      const next = Math.max(0, Math.min(Math.floor(qty) || 0, room));
      return next ? { ...rest, [key]: next } : rest;
    });
  }, [max]);
  return { draft, setQty, reset: setDraft };
}
