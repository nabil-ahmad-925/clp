'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LuFileText, LuSearch } from 'react-icons/lu';
import { DOCUMENT_KINDS, SITE_DOCUMENTS, type DocumentKind, type SiteDocument } from '@/content/documents';
import d from './WaiversDocuments.module.css';

const TONE = { required: d.tagRequired, recommended: d.tagRecommended, plain: d.tagPlain };

/**
 * The list (the Current Designs board): the search on the hero's edge, the kinds (All, Waivers & releases, Policies,
 * Forms, Safety guides), "Sign once, you're set", then each document with Read / Download PDF (a page: Open page).
 */
export default function WaiversDocuments() {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<DocumentKind | ''>('');
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = SITE_DOCUMENTS.filter((doc) => (!kind || doc.kind === kind) && words.every((w) => `${doc.title} ${doc.about} ${doc.tag}`.toLowerCase().includes(w)));
  return (
    <div className={d.wrap}>
      <label className={d.search}>
        <LuSearch aria-hidden />
        <input type="search" placeholder="Search waivers, forms and guides" aria-label="Search waivers, forms and guides" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className={d.kinds} role="group" aria-label="Kind">
        {[{ id: '' as const, label: 'All' }, ...DOCUMENT_KINDS].map((k) => (
          <button key={k.id || 'all'} type="button" aria-pressed={kind === k.id} className={`${d.kind} ${kind === k.id ? d.kindOn : ''}`} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <div className={d.banner}>
        <strong>Sign once, you’re set</strong>
        <span>The waiver and releases you agree to at checkout or check-in are saved with your booking. Parents sign for players under 18.</span>
      </div>
      <div className={d.list}>
        {shown.map((doc) => (
          <Row key={doc.id} doc={doc} />
        ))}
        {shown.length === 0 && <p className={d.empty}>No documents match. Try another word.</p>}
      </div>
      <p className={d.note}>Partners can add their own documents to an experience. Those show at checkout for that experience only.</p>
    </div>
  );
}

function Row({ doc }: { doc: SiteDocument }) {
  const external = doc.read?.startsWith('http');
  const read = doc.read ? (
    external ? (
      <a className={d.btn} href={doc.read} target="_blank" rel="noopener">
        Read ↗
      </a>
    ) : (
      <Link className={doc.page ? d.btnDark : d.btn} href={doc.read}>
        {doc.page ? 'Open page' : 'Read'}
      </Link>
    )
  ) : null;
  return (
    <article className={d.row}>
      <span className={d.icon} aria-hidden>
        <LuFileText />
      </span>
      <span className={d.text}>
        <span className={d.titleLine}>
          <strong>{doc.title}</strong>
          <span className={`${d.tag} ${TONE[doc.tone]}`}>{doc.tag}</span>
        </span>
        <span className={d.about}>{doc.about}</span>
        {doc.meta && <span className={d.meta}>{doc.meta}</span>}
      </span>
      <span className={d.actions}>
        {read}
        {doc.pdf && (
          <a className={d.btnDark} href={doc.pdf} download>
            Download PDF
          </a>
        )}
        {!read && !doc.pdf && <span className={d.soon}>Available soon</span>}
      </span>
    </article>
  );
}
