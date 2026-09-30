'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { mainNav, site } from '@/content/site';
import type { NavItem } from '@/content/types';
import styles from './FullscreenMenu.module.css';

type Props = { open: boolean; onClose: () => void };

const isCurrent = (item: NavItem, pathname: string) =>
  item.href === pathname || !!item.children?.some((child) => child.href === pathname);

export default function FullscreenMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  // Index of the parent item whose sub-menu is shown (Salient's "sub-view" navigation).
  const [subview, setSubview] = useState<number | null>(null);
  // Always reopen at the top level.
  const [wasOpen, setWasOpen] = useState(open);
  // True once the visitor has moved between the main list and a sub-menu (uses a quicker animation).
  const [swapped, setSwapped] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSubview(null);
      setSwapped(false);
    }
  }

  const showSubview = (index: number | null) => {
    setSubview(index);
    setSwapped(true);
  };

  // Lock page scroll and listen for Escape while open.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const close = () => {
    onClose();
    setSubview(null);
  };

  const items: { item: NavItem; back?: boolean }[] =
    subview === null
      ? mainNav.map((item) => ({ item }))
      : [{ item: { label: 'Back', href: '#' }, back: true }, ...(mainNav[subview].children ?? []).map((item) => ({ item }))];

  return (
    <div className={`${styles.root} ${open ? styles.open : ''}`} aria-hidden={!open}>
      <div className={styles.bg} />
      <nav id="fullscreen-menu" className={styles.panel} aria-label="Main menu">
        <div className={styles.inner}>
          <ul
            key={subview ?? 'root'}
            className={[styles.menu, subview !== null && styles.sub, swapped && styles.swap].filter(Boolean).join(' ')}
          >
            {items.map(({ item, back }, i) => {
              const parentIndex = subview === null && item.children ? mainNav.indexOf(item) : -1;
              const className = [styles.link, isCurrent(item, pathname) && styles.current, back && styles.back].filter(Boolean).join(' ');
              const style = { '--i': i } as CSSProperties;
              const tabIndex = open ? undefined : -1;

              if (back || parentIndex !== -1) {
                return (
                  <li key={item.label} style={style}>
                    <a
                      href={back ? '#' : item.href}
                      className={className}
                      tabIndex={tabIndex}
                      aria-haspopup={back ? undefined : 'true'}
                      onClick={(e) => {
                        e.preventDefault();
                        showSubview(back ? null : parentIndex);
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              }

              if (item.icon === 'cart') {
                return (
                  <li key={item.label} style={style}>
                    <a href={item.href} className={`${className} ${styles.cart}`} tabIndex={tabIndex} aria-label={item.label} onClick={close}>
                      <FaShoppingCart aria-hidden />
                    </a>
                  </li>
                );
              }

              return (
                <li key={item.label} style={style}>
                  {item.external ? (
                    <a href={item.href} className={className} target="_blank" rel="noopener" tabIndex={tabIndex} onClick={close}>
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href} className={className} tabIndex={tabIndex} onClick={close} aria-current={item.href === pathname ? 'page' : undefined}>
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <p className={styles.bottomText}>
          {site.menuCopyright[0]}
          <br />
          {site.menuCopyright[1]}
        </p>
      </nav>
    </div>
  );
}
