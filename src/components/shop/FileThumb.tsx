'use client';
/* eslint-disable @next/next/no-img-element -- the client's own file, shown as they sent it. */
import { useState } from 'react';
import type { ProductionFile } from '@/content/bulk';
import { isPicture, typeOf } from './fileWords';
import st from './requestStage.module.css';

type Version = ProductionFile['versions'][number];

/**
 * A production file they sent, as a preview opening in a new tab: the picture itself (PNG, JPG), or a card with its
 * type (SVG, AI, EPS, PDF, LINK) and name. A picture that won't load falls back to the card.
 */
export default function FileThumb({ v }: { v: Version }) {
  const [broken, setBroken] = useState(false);
  return (
    <a href={v.url} target="_blank" rel="noopener noreferrer" title={v.name}>
      {isPicture(v) && !broken ? (
        <img src={v.url} alt={v.name} loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <span className={st.fileCard}>
          <span className={st.fileType}>{typeOf(v)}</span>
          <span className={st.fileHost}>{v.name}</span>
          <span className={st.fileOpen}>Open ↗</span>
        </span>
      )}
    </a>
  );
}
