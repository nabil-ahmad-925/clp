'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './DropSelect.module.css';

type Option = { value: string; label: string };

/**
 * Single-choice dropdown drawn like the team plugin's filter menus: a white bar showing the current choice,
 * opening a list of round radio options. The first option ("All …") is the empty value.
 */
export default function DropSelect({ label, options, value, onChange }: { label: string; options: Option[]; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`${styles.container} ${open ? styles.open : ''}`}>
      <button type="button" className={styles.bar} aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span>{current?.label}</span>
        <span className={styles.arrow} aria-hidden />
      </button>
      <div id={id} className={styles.list} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <div key={o.value} className={`${styles.item} ${o.value === value ? styles.current : ''}`}>
            <label>
              <input
                type="radio"
                name={id}
                value={o.value}
                checked={o.value === value}
                tabIndex={open ? 0 : -1}
                onChange={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              />
              <span className={styles.status} aria-hidden />
              <span className={styles.label}>{o.label}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
