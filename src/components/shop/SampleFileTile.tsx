'use client';
/* eslint-disable @next/next/no-img-element -- the maker's photos, shown as CLP shared them. */
import { useState } from 'react';
import type { RequestSample } from '@/content/bulk';
import st from './requestStage.module.css';

type SampleFile = RequestSample['files'][number];

/** Sites makers share files from, by the name people know them by. */
const SITES: [RegExp, string][] = [
  [/(^|\.)drive\.google\.com$/, 'Google Drive'],
  [/(^|\.)docs\.google\.com$/, 'Google Docs'],
  [/(^|\.)dropbox(usercontent)?\.com$|^db\.tt$/, 'Dropbox'],
  [/(^|\.)wetransfer\.com$|^we\.tl$/, 'WeTransfer'],
  [/(^|\.)onedrive\.live\.com$|^1drv\.ms$|sharepoint\.com$/, 'OneDrive'],
  [/(^|\.)box\.com$/, 'Box'],
  [/(^|\.)youtube\.com$|^youtu\.be$/, 'YouTube'],
  [/(^|\.)vimeo\.com$/, 'Vimeo'],
];

/** A link's site, short: "Google Drive", "Dropbox", else its main domain ("example.com"). '' when it isn't a web address. */
function hostOf(url: string) {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
  return SITES.find(([re]) => re.test(host))?.[1] ?? host.split('.').slice(-2).join('.');
}

/**
 * One file of a proof, opening in a new tab: the photo itself, or a card the same size for anything else (a PDF with
 * its type, a link to another site with a link mark and the site's name; a picture that won't load, as its link).
 */
export default function SampleFileTile({ f }: { f: SampleFile }) {
  const [broken, setBroken] = useState(false);
  const pdf = /\.pdf$/i.test(f.name) || /\.pdf$/i.test(f.url.split(/[?#]/)[0] ?? '');
  const host = hostOf(f.url);
  return (
    <a href={f.url} target="_blank" rel="noopener noreferrer" title={f.image ? f.name : `${f.name} · ${f.url}`}>
      {f.image && !broken ? (
        <img src={f.url} alt={f.name} loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <span className={st.fileCard}>
          {pdf ? (
            <span className={st.fileType}>PDF</span>
          ) : (
            <svg className={st.linkMark} viewBox="0 0 24 24" aria-hidden>
              <path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span className={st.fileHost}>{pdf ? f.name.replace(/\.pdf$/i, '') || 'PDF' : host || 'Link'}</span>
          <span className={st.fileOpen}>Open ↗</span>
        </span>
      )}
    </a>
  );
}
