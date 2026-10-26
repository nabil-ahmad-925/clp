'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { site } from '@/content/site';
import type { HeaderTone } from '@/content/types';
import FullscreenMenu from './FullscreenMenu';
import { useHeaderBrand } from './headerBrand';
import styles from './SiteHeader.module.css';

// Pages without a hero get a solid black header instead of the transparent one.
// A CLP Partner's page (/partner/) too: the handoff's black header band, with the page's tabs sticking under it.
const SOLID_HEADER_PATHS = new Set(['/resources/', '/services/', '/book-a-session/', '/experiences/futbol/facilities-parks/', '/shopping-cart/', '/partner/', '/messages/']);

/** Finds the tone of the section currently behind the header (sections opt in with data-header-tone). */
function toneBehindHeader(header: HTMLElement): HeaderTone {
  const y = header.getBoundingClientRect().height / 2;
  const x = window.innerWidth / 2;
  for (const el of document.elementsFromPoint(x, y)) {
    if (header.contains(el)) continue;
    const tone = el.closest<HTMLElement>('[data-header-tone]')?.dataset.headerTone;
    if (tone === 'dark' || tone === 'light') return tone;
  }
  return 'light';
}

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const brand = useHeaderBrand();
  const [tone, setTone] = useState<HeaderTone>('light');
  const pathname = usePathname();
  const variant =
    SOLID_HEADER_PATHS.has(pathname) || pathname.startsWith('/category/') || pathname.startsWith('/author/') || pathname.startsWith('/clp-partners/')
      ? 'solid'
      : 'transparent';

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Swap to the dark logo/icon while the header sits over a light section.
  useEffect(() => {
    if (variant !== 'transparent') return;
    const header = document.getElementById('site-header');
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setTone(toneBehindHeader(header));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [variant, pathname]);

  const dark = variant === 'transparent' && tone === 'dark' && !menuOpen;

  return (
    <>
      <header id="site-header" className={[styles.header, styles[variant], dark && styles.dark, menuOpen && styles.menuOpen].filter(Boolean).join(' ')}>
        <div className={styles.inner}>
          <div className={styles.brandGroup}>
            <Link href="/" className={styles.logo} aria-label={site.name}>
              {variant === 'solid' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={site.logo.light}
                  srcSet={`${site.logo.light} 1x, ${site.logo.dark} 2x`}
                  width={site.logo.width}
                  height={site.logo.height}
                  alt={site.name}
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.logoLight} src={site.logo.light} width={site.logo.width} height={site.logo.height} alt={site.name} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.logoDark} src={site.logo.dark} width={site.logo.width} height={site.logo.height} alt="" aria-hidden />
                </>
              )}
            </Link>
            {/* A partner's page: co-branded, "CLP │ × AFC" (the shop: "CLP │ SHOP", leading to the shop's home, and Wholesale's to its own). */}
            {brand &&
              !menuOpen &&
              (brand.shop ? (
                <Link href={brand.href ?? '/shop/'} className={`${styles.cobrand} ${styles.cobrandShop}`}>
                  <span className={styles.cobrandRule} aria-hidden />
                  {brand.label}
                </Link>
              ) : (
                <span className={styles.cobrand}>
                  <span className={styles.cobrandRule} aria-hidden />× {brand.label}
                </span>
              ))}
          </div>

          <div className={styles.actions}>
            {brand && !menuOpen && (
              <button
                type="button"
                className={styles.cart}
                aria-label={`Cart, ${brand.cartCount} item${brand.cartCount === 1 ? '' : 's'}`}
                onClick={brand.onCart}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 7h12l-1.2 13H7.2L6 7Z" />
                  <path d="M9 7a3 3 0 0 1 6 0" />
                </svg>
                {brand.cartCount > 0 && <span className={styles.cartCount}>{brand.cartCount}</span>}
              </button>
            )}
            <button
              type="button"
              className={styles.toggle}
              aria-label={menuOpen ? 'Close Menu' : 'Navigation Menu'}
              aria-expanded={menuOpen}
              aria-controls="fullscreen-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className={styles.lines} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <FullscreenMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
