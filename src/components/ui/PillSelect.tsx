'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { LuCheck, LuChevronDown } from 'react-icons/lu';
import styles from './FilterChip.module.css';

type Props<T extends string | number> = {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  /** Names the menu for screen readers ("Sort results", "Results per page"). */
  label: string;
  icon?: ReactNode;
  /** 'up': the menu opens above the pill (one at the bottom of the page). */
  placement?: 'down' | 'up';
};

/**
 * The directory's drop-down (tenpo.com's select): a pill showing the chosen option, opening a menu of the others with
 * a check on the chosen one. Arrow keys, Home/End, Enter and Escape work as in a native select.
 */
export default function PillSelect<T extends string | number>({ value, options, onChange, label, icon, placement = 'down' }: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const choose = (next: T) => {
    if (next !== value) onChange(next);
    close();
  };
  const onListKey = (e: KeyboardEvent) => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape' || e.key === 'Tab') close();
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[(at + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items[e.key === 'Home' ? 0 : items.length - 1]?.focus();
    }
  };

  return (
    <div ref={ref} className={`${styles.sortWrap} ${open ? styles.isOpen : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.sort}
        aria-label={`${label}: ${current?.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {icon && (
          <span className={styles.sortIcon} aria-hidden>
            {icon}
          </span>
        )}
        <span>{current?.label}</span>
        <LuChevronDown className={styles.sortChevron} aria-hidden />
      </button>
      {open && (
        <div
          ref={listRef}
          id={listId}
          className={`${styles.sortList} ${placement === 'up' ? styles.sortListUp : ''}`}
          role="listbox"
          aria-label={label}
          onKeyDown={onListKey}
        >
          {options.map((o) => (
            <div
              key={o.value}
              role="option"
              tabIndex={-1}
              aria-selected={o.value === value}
              className={styles.sortItem}
              onClick={() => choose(o.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                choose(o.value);
              }}
            >
              {o.label}
              {o.value === value && <LuCheck className={styles.sortCheck} aria-hidden />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
