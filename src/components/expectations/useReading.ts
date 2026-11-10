'use client';

import { useState } from 'react';
import { SECTIONS, type SectionId } from '@/content/expectations';

/**
 * Reading the page section by section: the open section, the ones seen (their tabs get a ✓, the counter says how many
 * are read) and the open row (one at a time, the first open on each section, as the FAQ).
 */
export function useReading() {
  const [tab, setTab] = useState<SectionId>('short');
  const [seen, setSeen] = useState<Set<SectionId>>(() => new Set<SectionId>(['short']));
  const [openRow, setOpenRow] = useState(0);

  const index = SECTIONS.findIndex((s) => s.id === tab);
  const go = (id: SectionId) => {
    setTab(id);
    setSeen((prev) => new Set(prev).add(id));
    setOpenRow(0);
  };
  const toggleRow = (i: number) => setOpenRow((cur) => (cur === i ? -1 : i));

  return {
    tab,
    index,
    section: SECTIONS[index],
    prev: index > 0 ? SECTIONS[index - 1] : null,
    next: index < SECTIONS.length - 1 ? SECTIONS[index + 1] : null,
    seen,
    readCount: seen.size,
    openRow,
    go,
    toggleRow,
    /** Back to the first row open (a new role or search shows a new list). */
    resetRow: () => setOpenRow(0),
  };
}
