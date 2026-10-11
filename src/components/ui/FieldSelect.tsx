'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { LuCheck, LuChevronDown } from 'react-icons/lu';
import menu from './FilterChip.module.css';
import styles from './FieldSelect.module.css';

type Props = {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  /** The field's name for screen readers (its visible label is the form's). */
  label: string;
  /** The trigger's look: the form's own input class (border, height, font). */
  className?: string;
  invalid?: boolean;
};

/**
 * A form's drop-down drawn as the listing pages' sort menu ("Recommended"): a field showing the chosen option, opening
 * the same rounded menu with a check on the chosen one. Arrow keys, Home/End, Enter, Escape and Tab work as in a native
 * select; typing a letter jumps to the next option starting with it.
 */
export default function FieldSelect({ value, options, onChange, label, className = '', invalid }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    (listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]') ?? listRef.current?.querySelector<HTMLElement>('[role="option"]'))?.focus();
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
  const choose = (next: string) => {
    if (next !== value) onChange(next);
    close();
  };
  const onListKey = (e: KeyboardEvent) => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      // Esc closes the menu only, not a dialog it sits in.
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      close();
    } else if (e.key === 'Tab') setOpen(false);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[(at + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items[e.key === 'Home' ? 0 : items.length - 1]?.focus();
    } else if (/^[a-z]$/i.test(e.key)) {
      const next = items.find((el, i) => i > at && el.textContent?.trim().toLowerCase().startsWith(e.key.toLowerCase())) ??
        items.find((el) => el.textContent?.trim().toLowerCase().startsWith(e.key.toLowerCase()));
      next?.focus();
    }
  };

  return (
    <div ref={ref} className={`${menu.sortWrap} ${styles.wrap} ${open ? menu.isOpen : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`${className} ${styles.trigger}`}
        aria-label={`${label}: ${current?.label ?? 'choose'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        data-invalid={invalid ? 'true' : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className={current ? undefined : styles.placeholder}>{current?.label ?? 'Choose…'}</span>
        <LuChevronDown className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden />
      </button>
      {open && (
        <div ref={listRef} id={listId} className={`${menu.sortList} ${styles.list}`} role="listbox" aria-label={label} onKeyDown={onListKey}>
          {options.map((o) => (
            <div
              key={o.value}
              role="option"
              tabIndex={-1}
              aria-selected={o.value === value}
              className={menu.sortItem}
              onClick={() => choose(o.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                choose(o.value);
              }}
            >
              {o.label}
              {o.value === value && <LuCheck className={menu.sortCheck} aria-hidden />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
