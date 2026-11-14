'use client';

import { useState, type ReactNode } from 'react';
import c from './collapsible.module.css';
import st from './requestStage.module.css';

/**
 * A section of a request on Quote Requests that opens and closes: its title and a one-line summary always show (so
 * what needs them is never hidden), the rest when open. `on`: it waits on them (highlighted, even when closed).
 */
export default function CollapsibleBox({ title, summary, defaultOpen = false, on, className, children }: {
  title: string;
  summary?: ReactNode;
  defaultOpen?: boolean;
  on?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={className ?? st.box} data-on={on ? 'true' : undefined}>
      <button type="button" className={c.head} aria-expanded={open} onClick={() => setOpen(!open)}>
        <strong>{title}</strong>
        {summary && <span className={c.summary}>{summary}</span>}
        <span className={c.chev} aria-hidden>
          {open ? '−' : '+'}
        </span>
        <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {open ? 'Hide' : 'Show'}
        </span>
      </button>
      {open && children}
    </div>
  );
}
