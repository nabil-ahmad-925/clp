'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PRINT_GROUPS, PRINT_PRODUCTS, dollars, printFrom, printPrice, printRatio, type PrintProduct } from '@/content/gallery';
import { SITE_URL } from '@/content/site';
import type { GalleryImage } from '@/content/types';
import { addToGalleryCart, onGalleryCart, readGalleryCart } from '@/components/cart/galleryCart';
import styles from './GalleryLightbox.module.css';

type Props = {
  galleryId: string;
  /** The album's name (the side panel's label). */
  albumTitle: string;
  /** Public albums' photos can be shared; private, youth and client ones can't. */
  shareable: boolean;
  /** Who took the photos ("Photographed by …"; Compete Like Pros when not given). */
  by?: string;
  images: GalleryImage[];
  index: number;
  /** The side panel's tab on opening (the album's "Prints & products" filter opens on prints). */
  startTab?: 'digital' | 'print';
  onIndex: (index: number) => void;
  onClose: () => void;
  onOpenCart: () => void;
};

const Arrow = ({ back }: { back?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {back ? <path d="M19 12H5M11 18l-6-6 6-6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
  </svg>
);

/** Every option's first value: a product's starting choice. */
const defaults = (product: PrintProduct) => Object.fromEntries(product.options.map((o) => [o.id, o.options[0].value]));

/** "7 sizes · 2 depths · 3 edges". */
const summary = (product: PrintProduct) =>
  product.options.map((o) => `${o.options.length} ${o.label.toLowerCase()}${o.options.length > 1 && !/s$/.test(o.label.toLowerCase()) ? 's' : ''}`).join(' · ');

/** A product's mockup: the photo in the product's shape (a frame for framed prints), in a box of `max` px. */
function Mockup({ product, chosen, src, max }: { product: PrintProduct; chosen: Record<string, string>; src: string; max: number }) {
  const [w, h] = printRatio(product, chosen).split('/').map((n) => parseFloat(n));
  const wide = w / h >= 1;
  const frameColor = { Black: '#111111', White: '#F4F4F4', Oak: '#B08A5B', Walnut: '#5C3F2A' }[chosen.frame ?? ''];
  const matted = chosen.mat === 'White mat';
  return (
    <span
      className={styles.mockup}
      style={{
        aspectRatio: `${w} / ${h}`,
        width: wide ? max : 'auto',
        height: wide ? 'auto' : max,
        borderRadius: product.radius,
        border: product.frame && frameColor ? `${Math.round(max / 22)}px solid ${frameColor}` : undefined,
        padding: product.frame && matted ? Math.round(max / 14) : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- the photo on the product */}
      <img src={src} alt="" />
    </span>
  );
}

/**
 * The photo viewer (new design): the photo on black with the previous / next arrows, the count and a strip of
 * thumbnails; beside it a white panel with the album, the photo's number and two tabs. "Digital download": a free
 * photo's full-resolution file, or a paid one's license added to the cart. "Prints & products": the print catalog
 * (content/gallery.ts), then a product's options with a live preview, the quantity and "Add to cart". Arrow keys and
 * swipes step through the album, Esc or × closes it.
 */
export default function GalleryLightbox({ galleryId, albumTitle, shareable, by, images, index, startTab = 'digital', onIndex, onClose, onOpenCart }: Props) {
  const [tab, setTab] = useState<'digital' | 'print'>(startTab);
  const [product, setProduct] = useState<PrintProduct | null>(null);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [inCart, setInCart] = useState<string[]>([]);
  const touchX = useRef<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const image = images[index];
  const count = images.length;

  const go = (step: number) => onIndex((index + step + count) % count);
  const goRef = useRef(go);
  const closeRef = useRef(onClose);
  useEffect(() => {
    goRef.current = go;
    closeRef.current = onClose;
  });

  // Scroll locked behind it; keys step and close; the cart's count follows the cart.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'ArrowRight') goRef.current(1);
      if (e.key === 'ArrowLeft') goRef.current(-1);
    };
    const load = () => {
      const items = readGalleryCart();
      setCartCount(items.length);
      setInCart(items.filter((i) => i.kind === 'download').map((i) => i.photoId));
    };
    load();
    const off = onGalleryCart(load);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      off();
    };
  }, []);

  // The current thumbnail stays in view; the notices are per photo.
  useEffect(() => {
    strip.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the photo changes
    setAdded(false);
    setDownloaded(false);
  }, [index]);

  const pageUrl = typeof window === 'undefined' ? SITE_URL : window.location.origin + window.location.pathname;
  const shareUrl = encodeURIComponent(`${pageUrl}#gallery/${galleryId}/${image.id}`);
  const imageUrl = encodeURIComponent(typeof window === 'undefined' ? image.full : window.location.origin + image.full);
  const price = image.download;
  const photoName = `Photo ${index + 1} · ${albumTitle}`;

  const addDownload = () => {
    if (price == null) return;
    addToGalleryCart({ kind: 'download', photoId: image.id, src: image.thumb || image.src, name: 'Personal download', detail: photoName, price, qty: 1 });
    setAdded(true);
  };
  const openProduct = (p: PrintProduct) => {
    setProduct(p);
    setChosen(defaults(p));
    setQty(1);
    setAdded(false);
  };
  const unit = product ? printPrice(product, chosen) : 0;
  const addPrint = () => {
    if (!product) return;
    const detail = product.options.map((o) => o.options.find((x) => x.value === chosen[o.id])?.label ?? chosen[o.id]).join(' · ');
    addToGalleryCart({ kind: 'print', photoId: image.id, src: image.thumb || image.src, name: `${product.name}${qty > 1 ? ` × ${qty}` : ''}`, detail: `${detail} · ${photoName}`, price: unit * qty, qty });
    setAdded(true);
  };

  return createPortal(
    <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={`${albumTitle}: photo ${index + 1} of ${count}`}>
      <div className={styles.main}>
        <div
          className={styles.stage}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- the full-size original */}
          <img key={image.id} className={styles.image} src={image.full} alt={image.alt} />
          {count > 1 && (
            <>
              <button type="button" className={`${styles.round} ${styles.prev}`} aria-label="Previous photo" onClick={() => go(-1)}>
                <Arrow back />
              </button>
              <button type="button" className={`${styles.round} ${styles.next}`} aria-label="Next photo" onClick={() => go(1)}>
                <Arrow />
              </button>
            </>
          )}
          <button type="button" className={`${styles.round} ${styles.close}`} aria-label="Close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M5 5l14 14M19 5 5 19" />
            </svg>
          </button>
          <span className={styles.counter}>
            {index + 1} / {count}
          </span>
        </div>
        <div ref={strip} className={styles.thumbs}>
          {images.map((thumb, i) => (
            <button
              key={thumb.id}
              type="button"
              className={`${styles.thumb} ${i === index ? styles.thumbOn : ''}`}
              aria-label={`Photo ${i + 1} of ${count}`}
              aria-current={i === index}
              onClick={() => onIndex(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- the original thumbnail file */}
              <img src={thumb.thumb} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <aside className={styles.side}>
        <div className={styles.sideHead}>
          <span className={styles.kicker}>{albumTitle.toUpperCase()}</span>
          <span className={styles.photoTitle}>Photo {index + 1}</span>
          <span className={styles.by}>Photographed by {by ?? 'Compete Like Pros'}</span>
        </div>

        <div className={styles.tabs} role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'digital'} className={`${styles.tab} ${tab === 'digital' ? styles.tabOn : ''}`} onClick={() => setTab('digital')}>
            Digital download
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'print'}
            className={`${styles.tab} ${tab === 'print' ? styles.tabOn : ''}`}
            onClick={() => {
              setTab('print');
              setAdded(false);
            }}
          >
            Prints &amp; products
          </button>
        </div>

        {tab === 'digital' && (
          <div className={styles.sideBody}>
            {image.noDownload ? (
              <div className={styles.buy}>
                <span className={styles.lineTitle}>Full-resolution download</span>
                <span className={styles.muted}>Downloads aren&rsquo;t offered for this album.</span>
              </div>
            ) : price == null ? (
              <div className={styles.buy}>
                <span className={styles.lineTitle}>
                  Full-resolution download<strong>Free</strong>
                </span>
                <span className={styles.muted}>Free for personal use.</span>
                <a className={styles.primary} href={image.downloadUrl ?? image.full} download onClick={() => setDownloaded(true)}>
                  {downloaded ? 'Downloaded ✓' : 'Download photo'}
                </a>
              </div>
            ) : (
              <div className={styles.buy}>
                <div className={styles.option} aria-pressed="true">
                  <span className={styles.optionText}>
                    <strong>Personal download</strong>
                    <span>Full resolution, personal use</span>
                  </span>
                  <strong>{dollars(price)}</strong>
                </div>
                <button type="button" className={styles.primary} disabled={inCart.includes(image.id)} onClick={addDownload}>
                  {inCart.includes(image.id) ? 'In your cart' : `Add to cart · ${dollars(price)}`}
                </button>
              </div>
            )}

            <div className={styles.share}>
              <span className={styles.label}>SHARE</span>
              {shareable ? (
                <div className={styles.shareLinks}>
                  <a href={`https://twitter.com/share?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.5z" />
                    </svg>
                  </a>
                  <a href={`https://www.facebook.com/share.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M13.5 22v-8.4h2.8l.5-3.4h-3.3V8.1c0-1 .3-1.7 1.7-1.7h1.8V3.3c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.5H7.1v3.4H10V22z" />
                    </svg>
                  </a>
                  <a href={`https://pinterest.com/pin/create/button/?url=${shareUrl}&media=${imageUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Pinterest">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.3-5.4s-.3-.7-.3-1.6c0-1.5.9-2.7 2-2.7.9 0 1.4.7 1.4 1.6 0 1-.6 2.4-.9 3.7-.3 1.1.6 2 1.7 2 2 0 3.5-2.1 3.5-5.2 0-2.7-2-4.6-4.8-4.6-3.3 0-5.2 2.5-5.2 5 0 1 .4 2.1.9 2.7.1.1.1.2.1.3l-.3 1.3c-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.7 2.7-7.2 7.9-7.2 4.1 0 7.3 2.9 7.3 6.9 0 4.1-2.6 7.4-6.2 7.4-1.2 0-2.4-.6-2.7-1.4l-.7 2.8c-.3 1-1 2.3-1.5 3.1A10 10 0 1 0 12 2z" />
                    </svg>
                  </a>
                </div>
              ) : (
                <span className={styles.muted}>Sharing is off for private, youth and client albums.</span>
              )}
            </div>
          </div>
        )}

        {tab === 'print' && image.printable === false && (
          <div className={styles.sideBody}>
            <div className={styles.buy}>
              <span className={styles.lineTitle}>Prints &amp; products</span>
              <span className={styles.muted}>{image.printNote ?? 'Prints and products aren’t offered for this photo.'}</span>
            </div>
          </div>
        )}

        {tab === 'print' && image.printable !== false && !product && (
          <div className={styles.sideBody}>
            {PRINT_GROUPS.map((group) => (
              <div key={group} className={styles.group}>
                <span className={styles.label}>{group.toUpperCase()}</span>
                {PRINT_PRODUCTS.filter((p) => p.group === group).map((p) => (
                  <button key={p.id} type="button" className={styles.product} onClick={() => openProduct(p)}>
                    <span className={styles.productThumb}>
                      <Mockup product={p} chosen={defaults(p)} src={image.thumb || image.src} max={38} />
                    </span>
                    <span className={styles.productText}>
                      <strong>{p.name}</strong>
                      <span>{summary(p)}</span>
                    </span>
                    <span className={styles.from}>
                      from <strong>{dollars(printFrom(p))}</strong>
                    </span>
                    <span className={styles.chevron} aria-hidden>
                      ›
                    </span>
                  </button>
                ))}
              </div>
            ))}
            <span className={styles.muted}>Products available for this album are set by the event organizer.</span>
          </div>
        )}

        {tab === 'print' && image.printable !== false && product && (
          <div className={styles.sideBody}>
            <button
              type="button"
              className={styles.back}
              onClick={() => {
                setProduct(null);
                setAdded(false);
              }}
            >
              <span className="glyph" aria-hidden>←</span> All products
            </button>
            <div className={styles.preview}>
              <Mockup product={product} chosen={chosen} src={image.src} max={220} />
            </div>
            <div className={styles.productHead}>
              <span className={styles.productName}>{product.name}</span>
              <span className={styles.productPrice}>{dollars(unit)}</span>
            </div>
            <span className={styles.productDesc}>{product.desc}</span>

            {product.options.map((o) => {
              const current = o.options.find((x) => x.value === chosen[o.id]) ?? o.options[0];
              const pick = (value: string) => {
                setChosen({ ...chosen, [o.id]: value });
                setAdded(false);
              };
              return (
                <div key={o.id} className={styles.optGroup}>
                  <span className={styles.optLabel}>
                    {o.label}
                    <span>{current.label}</span>
                  </span>
                  {o.type === 'list' && (
                    <div className={styles.list} role="radiogroup" aria-label={o.label}>
                      {o.options.map((x) => (
                        <button key={x.value} type="button" role="radio" aria-checked={x.value === current.value} className={`${styles.listItem} ${x.value === current.value ? styles.listOn : ''}`} onClick={() => pick(x.value)}>
                          <span className={styles.radio} aria-hidden />
                          <span className={styles.listLabel}>{x.label}</span>
                          {x.price != null && <span className={styles.listPrice}>{dollars(x.price)}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {o.type === 'seg' && (
                    <div className={styles.seg} role="radiogroup" aria-label={o.label}>
                      {o.options.map((x) => (
                        <button key={x.value} type="button" role="radio" aria-checked={x.value === current.value} className={`${styles.segItem} ${x.value === current.value ? styles.segOn : ''}`} onClick={() => pick(x.value)}>
                          {x.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {o.type === 'swatch' && (
                    <div className={styles.swatches} role="radiogroup" aria-label={o.label}>
                      {o.options.map((x) => (
                        <button key={x.value} type="button" role="radio" aria-checked={x.value === current.value} aria-label={x.label} className={`${styles.swatch} ${x.value === current.value ? styles.swatchOn : ''}`} onClick={() => pick(x.value)}>
                          <span style={{ background: x.swatch }} />
                        </button>
                      ))}
                    </div>
                  )}
                  {o.type === 'select' && (
                    <select className={styles.select} aria-label={o.label} value={current.value} onChange={(e) => pick(e.target.value)}>
                      {o.options.map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}

            <div className={styles.buyRow}>
              <span className={styles.qty}>
                <button type="button" aria-label="Fewer" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>
                  −
                </button>
                <span aria-live="polite">{qty}</span>
                <button type="button" aria-label="More" disabled={qty >= 20} onClick={() => setQty(qty + 1)}>
                  +
                </button>
              </span>
              <button type="button" className={styles.primary} onClick={addPrint}>
                Add to cart · {dollars(unit * qty)}
              </button>
            </div>
            <span className={styles.muted}>Printed on demand and shipped by our print partner. Ships in {product.ships}.</span>
          </div>
        )}

        {added && (
          <div className={styles.added} role="status">
            Added to cart.{' '}
            <button type="button" onClick={onOpenCart}>
              View cart ({cartCount})
            </button>
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
