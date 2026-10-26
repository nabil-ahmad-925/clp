'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PRINT_GROUPS, dollars, printBackKey, printFrom, printPrice, printRatio, type PrintProduct } from '@/content/gallery';
import usePrintProducts from '@/components/photos/usePrintProducts';
import { fetchPrintBacks } from '@/content/albums';
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
  /** Their partner page ("Photographed by" links to it). */
  byHref?: string;
  /** The owner's partner page slug (a partner's album): its print products. */
  partner?: string;
  images: GalleryImage[];
  index: number;
  /** The side panel's tab on opening (the album's "Prints & products" filter opens on prints). */
  startTab?: 'digital' | 'print';
  onIndex: (index: number) => void;
  onClose: () => void;
  onOpenCart: () => void;
  /**
   * `images` as one page of a longer list: where the page starts in it (`offset`) and its length (`total`), for the
   * photo numbers and the count; stepping past the page's first or last photo asks for the page before or after.
   */
  paged?: { offset: number; total: number; onEdge: (step: 1 | -1) => void };
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

/**
 * The back of a wall-art product, drawn as it looks (in the product's shape, `ratio` = width / height):
 * - a canvas: the linen over wooden stretcher bars (thicker for the 1.5 in depth) with a centre brace, corner keys,
 *   staples, a sawtooth hanger and the maker's label;
 * - a metal print: brushed aluminum with its black float mount (screws and all) or its easel leg, and the label;
 * - a framed print: the kraft backing inside the frame, its retaining tabs, D-rings and hanging wire, bumpers and label.
 */
function BackArt({ kind, ratio, chosen }: { kind: 'canvas' | 'metal' | 'frame'; ratio: number; chosen: Record<string, string> }) {
  const uid = useId().replace(/:/g, '');
  const W = 100 * ratio;
  const H = 100;
  const m = Math.min(W, H);
  const label = (x: number, y: number, lw: number) => (
    <g>
      <rect x={x} y={y} width={lw} height={lw * 0.5} rx={0.8} fill="#ffffff" stroke="rgba(0,0,0,0.12)" strokeWidth={0.3} />
      <rect x={x + lw * 0.1} y={y + lw * 0.1} width={lw * 0.36} height={lw * 0.09} fill="#8a6f33" />
      <rect x={x + lw * 0.1} y={y + lw * 0.25} width={lw * 0.78} height={lw * 0.05} fill="#c8c4bb" />
      <rect x={x + lw * 0.1} y={y + lw * 0.35} width={lw * 0.6} height={lw * 0.05} fill="#c8c4bb" />
    </g>
  );

  if (kind === 'canvas') {
    const t = m * (chosen.depth === '1.5 in' ? 0.13 : 0.1);
    // The staples along one bar: `along` places the n-th at its distance from the bar's start.
    const staples = (len: number, along: (at: number) => [number, number, boolean]): ReactNode[] => {
      const count = Math.max(3, Math.floor(len / 11));
      return Array.from({ length: count }, (_, i) => {
        const [x, y, vertical] = along(((i + 0.5) / count) * len);
        return <rect key={i} x={vertical ? x - 0.35 : x - 1.6} y={vertical ? y - 1.6 : y - 0.35} width={vertical ? 0.7 : 3.2} height={vertical ? 3.2 : 0.7} fill="#7d7d7d" />;
      });
    };
    const wood = `url(#${uid}w)`;
    return (
      <svg className={styles.backArt} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <defs>
          <pattern id={`${uid}l`} width={2.4} height={2.4} patternUnits="userSpaceOnUse">
            <rect width={2.4} height={2.4} fill="#efe7d3" />
            <path d="M0 0.6H2.4M0 1.8H2.4" stroke="#e2d8c0" strokeWidth={0.35} />
            <path d="M0.6 0V2.4M1.8 0V2.4" stroke="#e8dfca" strokeWidth={0.3} />
          </pattern>
          <linearGradient id={`${uid}w`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ddb57d" />
            <stop offset="0.5" stopColor="#cfa16a" />
            <stop offset="1" stopColor="#c08f58" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}l)`} />
        {/* The stretcher bars, the centre brace and their grain. */}
        <rect x={0} y={0} width={W} height={t} fill={wood} />
        <rect x={0} y={H - t} width={W} height={t} fill={wood} />
        <rect x={0} y={0} width={t} height={H} fill={wood} />
        <rect x={W - t} y={0} width={t} height={H} fill={wood} />
        {ratio >= 1 ? <rect x={W / 2 - t * 0.4} y={0} width={t * 0.8} height={H} fill={wood} /> : <rect x={0} y={H / 2 - t * 0.4} width={W} height={t * 0.8} fill={wood} />}
        <g stroke="#a87a45" strokeOpacity={0.35} strokeWidth={0.3} fill="none">
          <path d={`M2 ${t * 0.35}H${W - 2}M2 ${t * 0.7}H${W - 2}M2 ${H - t * 0.4}H${W - 2}`} />
          <path d={`M${t * 0.4} 2V${H - 2}M${W - t * 0.45} 2V${H - 2}`} />
        </g>
        {/* Corner keys. */}
        {[
          [t, t, 1, 1],
          [W - t, t, -1, 1],
          [t, H - t, 1, -1],
          [W - t, H - t, -1, -1],
        ].map(([x, y, dx, dy], i) => (
          <path key={i} d={`M${x} ${y}l${dx * t * 0.7} 0l${-dx * t * 0.7} ${dy * t * 0.7}z`} fill="#b88a55" stroke="#9c7244" strokeWidth={0.3} />
        ))}
        {/* The canvas stapled round the bars' outer edge. */}
        {staples(W, (at) => [at, t * 0.18, false])}
        {staples(W, (at) => [at, H - t * 0.18, false])}
        {staples(H, (at) => [t * 0.18, at, true])}
        {staples(H, (at) => [W - t * 0.18, at, true])}
        {/* The sawtooth hanger. */}
        <path d={`M${W / 2 - 5} ${t * 0.55}l1 -1.4l1 1.4l1 -1.4l1 1.4l1 -1.4l1 1.4l1 -1.4l1 1.4l1 -1.4l1 1.4`} stroke="#6f6f6f" strokeWidth={0.7} fill="none" />
        {label(W - t - m * 0.32 - 3, H - t - m * 0.16 - 3, m * 0.32)}
      </svg>
    );
  }

  if (kind === 'metal') {
    const easel = chosen.mount === 'Easel back';
    return (
      <svg className={styles.backArt} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <defs>
          <linearGradient id={`${uid}a`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e6e9ec" />
            <stop offset="0.55" stopColor="#c9ced3" />
            <stop offset="1" stopColor="#b3b8be" />
          </linearGradient>
          <pattern id={`${uid}b`} width={W} height={1.2} patternUnits="userSpaceOnUse">
            <path d={`M0 0.3H${W}`} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={0.25} />
            <path d={`M0 0.9H${W}`} stroke="#8e949b" strokeOpacity={0.18} strokeWidth={0.25} />
          </pattern>
          <linearGradient id={`${uid}k`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a3a3a" />
            <stop offset="1" stopColor="#151515" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}a)`} />
        <rect width={W} height={H} fill={`url(#${uid}b)`} />
        {easel ? (
          <g>
            {/* The easel leg, hinged near the top, and its hinge plate. */}
            <rect x={W / 2 - m * 0.12} y={H * 0.16} width={m * 0.24} height={m * 0.07} rx={0.8} fill={`url(#${uid}k)`} />
            <path d={`M${W / 2 - m * 0.07} ${H * 0.22}L${W / 2 + m * 0.07} ${H * 0.22}L${W / 2 + m * 0.11} ${H * 0.9}L${W / 2 - m * 0.11} ${H * 0.9}Z`} fill={`url(#${uid}k)`} />
            <path d={`M${W / 2} ${H * 0.24}V${H * 0.88}`} stroke="#4a4a4a" strokeWidth={0.4} />
          </g>
        ) : (
          <g>
            {/* The float mount: a black block that holds the print off the wall, its screws, its hanging slot. */}
            <rect x={W * 0.25} y={H * 0.28} width={W * 0.5} height={H * 0.44} rx={1.2} fill={`url(#${uid}k)`} />
            <rect x={W * 0.25 + 1} y={H * 0.28 + 1} width={W * 0.5 - 2} height={1.4} fill="#ffffff" opacity={0.08} />
            <rect x={W / 2 - m * 0.09} y={H * 0.33} width={m * 0.18} height={m * 0.05} rx={m * 0.025} fill="#0a0a0a" stroke="#555" strokeWidth={0.25} />
            {[
              [0.29, 0.33],
              [0.71, 0.33],
              [0.29, 0.67],
              [0.71, 0.67],
            ].map(([x, y], i) => (
              <g key={i}>
                <circle cx={W * x} cy={H * y} r={m * 0.025} fill="#9aa0a6" stroke="#5b5f63" strokeWidth={0.3} />
                <path d={`M${W * x - m * 0.015} ${H * y}h${m * 0.03}`} stroke="#5b5f63" strokeWidth={0.4} />
              </g>
            ))}
          </g>
        )}
        {label(W * 0.06, H - m * 0.2, m * 0.26)}
      </svg>
    );
  }

  // A framed print's back: kraft backing, retaining tabs, D-rings and wire, bumpers, the label.
  return (
    <svg className={styles.backArt} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <defs>
        <pattern id={`${uid}f`} width={6} height={6} patternUnits="userSpaceOnUse">
          <rect width={6} height={6} fill="#b98d5c" />
          <path d="M0.5 1.5l2 0.4M3 4l2.2 -0.3M1 5l1.2 0.5" stroke="#a87c4d" strokeWidth={0.3} />
          <path d="M3.5 1l1 0.6M0.6 3.6l1.4 -0.4" stroke="#c99d6b" strokeWidth={0.3} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}f)`} />
      {/* The retaining tabs round the edge. */}
      {[0.25, 0.75].flatMap((f, i) => [
        <rect key={`t${i}`} x={W * f - 2} y={0} width={4} height={2.2} fill="#9a9a9a" />,
        <rect key={`b${i}`} x={W * f - 2} y={H - 2.2} width={4} height={2.2} fill="#9a9a9a" />,
        <rect key={`l${i}`} x={0} y={H * f - 2} width={2.2} height={4} fill="#9a9a9a" />,
        <rect key={`r${i}`} x={W - 2.2} y={H * f - 2} width={2.2} height={4} fill="#9a9a9a" />,
      ])}
      {/* D-rings a third down each side, and the wire between them. */}
      <path d={`M${W * 0.14} ${H * 0.3} Q${W / 2} ${H * 0.16} ${W * 0.86} ${H * 0.3}`} stroke="#6d6d6d" strokeWidth={0.7} fill="none" />
      {[0.14, 0.86].map((x) => (
        <g key={x}>
          <rect x={W * x - 2} y={H * 0.3 - 1.2} width={4} height={3} rx={0.6} fill="#8a8a8a" />
          <path d={`M${W * x - 1.6} ${H * 0.3 - 1.2} a1.6 1.6 0 0 1 3.2 0`} stroke="#6d6d6d" strokeWidth={0.6} fill="none" />
        </g>
      ))}
      {/* The bumpers on the bottom corners. */}
      {[W * 0.1, W * 0.9].map((x) => (
        <circle key={x} cx={x} cy={H * 0.9} r={m * 0.025} fill="#efefef" opacity={0.85} />
      ))}
      {label(W / 2 - m * 0.16, H * 0.62, m * 0.32)}
    </svg>
  );
}

/**
 * A product's mockup: the photo in the product's shape (a frame for framed prints), in a box of `max` px. `back`: its
 * back instead (`product.back`): a canvas' stretcher bars, a metal print's float mount or easel back, a frame's backing
 * and hanging wire, a poster's paper, a mug's far side, a blanket's fleece or sherpa, a garment's blank back in its
 * colour, a phone case's inside or a sticker's liner.
 */
export function Mockup({
  product,
  chosen,
  src,
  max,
  back,
  backPhoto,
}: {
  product: PrintProduct;
  chosen: Record<string, string>;
  src: string;
  max: number;
  back?: boolean;
  /** The back's photo (the API's print backs); drawn when there is none (still loading, or not uploaded). */
  backPhoto?: string;
}) {
  const [w, h] = printRatio(product, chosen).split('/').map((n) => parseFloat(n));
  const wide = w / h >= 1;
  const frameColor = { Black: '#111111', White: '#F4F4F4', Oak: '#B08A5B', Walnut: '#5C3F2A' }[chosen.frame ?? ''];
  const matted = chosen.mat === 'White mat';
  const side = back ? product.back : undefined;
  // A garment's or a mug's chosen colour (its back is that colour, or shows it at the seam).
  const swatch = product.options.find((o) => o.id === 'color')?.options.find((o) => o.value === chosen.color)?.swatch ?? '#FFFFFF';
  const sideClass = side ? styles[`back_${side}`] : '';
  return (
    <span
      className={`${styles.mockup} ${side ? styles.backSide : ''} ${sideClass ?? ''} ${side === 'fabric' && chosen.material === 'Sherpa' ? styles.back_sherpa : ''}`}
      style={{
        aspectRatio: `${w} / ${h}`,
        width: wide ? max : 'auto',
        height: wide ? 'auto' : max,
        borderRadius: product.radius,
        border: product.frame && frameColor ? `${Math.round(max / 22)}px solid ${frameColor}` : undefined,
        padding: product.frame && matted && !side ? Math.round(max / 14) : undefined,
        ...(side === 'garment' ? { background: swatch } : {}),
      }}
    >
      {side === 'canvas' || side === 'metal' || side === 'frame' ? (
        <BackArt kind={side} ratio={w / h} chosen={chosen} />
      ) : side === 'paper' ? (
        <span className={styles.paperLabel}>Compete Like Pros</span>
      ) : side === 'wrap' ? (
        <>
          {/* The far side of the full-wrap print, the handle's seam down its middle. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- the photo on the product */}
          <img src={src} alt="" style={{ objectPosition: '100% 50%', transform: 'scaleX(-1)' }} />
          <span className={styles.seam} style={{ background: swatch }} />
        </>
      ) : side === 'garment' ? (
        <span className={styles.neckTag} style={{ background: swatch === '#FFFFFF' || swatch === '#B5B5B5' ? '#1a1a1a' : '#f4f4f4' }} />
      ) : side === 'case' ? (
        <span className={styles.caseCamera} />
      ) : side === 'liner' ? (
        <span className={styles.linerSlit} />
      ) : side === 'fabric' ? null : (
        // eslint-disable-next-line @next/next/no-img-element -- the photo on the product
        <img src={src} alt="" />
      )}
      {/* The back's photo over its drawing: the drawing shows until the photo has loaded (or when there is none). */}
      {/* eslint-disable-next-line @next/next/no-img-element -- the back's photo (the media bucket) */}
      {side && backPhoto && <img className={styles.backPhoto} src={backPhoto} alt="" />}
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
export default function GalleryLightbox({ galleryId, albumTitle, shareable, by, byHref, partner, images, index, startTab = 'digital', onIndex, onClose, onOpenCart, paged }: Props) {
  const [tab, setTab] = useState<'digital' | 'print'>(startTab);
  const [product, setProduct] = useState<PrintProduct | null>(null);
  // The product's side in its preview: its front (the photo on it) or its back.
  const [side, setSide] = useState<'front' | 'back'>('front');
  // The preview's mockup fits its box, clear of its FRONT / BACK label and its hint, up to 300 px.
  const [previewSize, setPreviewSize] = useState(220);
  const previewBox = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = previewBox.current;
    if (!el) return;
    const fit = () => setPreviewSize(Math.max(140, Math.min(300, Math.floor(Math.min(el.clientWidth - 48, el.clientHeight - 96)))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [product]);
  // The products CLP offers on this album's photos (Photo products): its photographer's partner page decides the
  // partners-only ones.
  const { products, ready } = usePrintProducts(partner);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  // The products' back photos, once a product is opened.
  const [backs, setBacks] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!product) return;
    let live = true;
    fetchPrintBacks().then((b) => live && setBacks(b));
    return () => {
      live = false;
    };
  }, [product]);
  const [inCart, setInCart] = useState<string[]>([]);
  const touchX = useRef<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const image = images[index];
  // The photo's number and how many there are: across every page when this is one page of them.
  const count = paged?.total ?? images.length;
  const number = (paged?.offset ?? 0) + index + 1;

  const go = (step: 1 | -1) => {
    const next = index + step;
    if (paged && (next < 0 || next >= images.length)) paged.onEdge(step);
    else onIndex((next + images.length) % images.length);
  };
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
  const photoName = `Photo ${number} · ${albumTitle}`;

  const addDownload = () => {
    if (price == null) return;
    addToGalleryCart({ kind: 'download', photoId: image.id, src: image.thumb || image.src, name: 'Personal download', detail: photoName, price, qty: 1 });
    setAdded(true);
  };
  const openProduct = (p: PrintProduct) => {
    setProduct(p);
    setSide('front');
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
    <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={`${albumTitle}: photo ${number} of ${count}`}>
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
            {number} / {count}
          </span>
        </div>
        <div ref={strip} className={styles.thumbs}>
          {images.map((thumb, i) => (
            <button
              key={thumb.id}
              type="button"
              className={`${styles.thumb} ${i === index ? styles.thumbOn : ''}`}
              aria-label={`Photo ${(paged?.offset ?? 0) + i + 1} of ${count}`}
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
        {/* As the site's headings: the title and its lines, the gold eyebrow under them. */}
        <div className={styles.sideHead}>
          <span className={styles.photoTitle}>Photo {number}</span>
          <span className={styles.by}>
            Photographed by{' '}
            {byHref ? (
              <Link href={byHref} className={styles.byLink}>
                {by}
              </Link>
            ) : (
              (by ?? 'Compete Like Pros')
            )}
          </span>
          {image.description && <p className={styles.description}>{image.description}</p>}
          <span className={styles.kicker}>{albumTitle.toUpperCase()}</span>
        </div>

        <div className={styles.tabs} role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'digital'} className={`${styles.tab} ${tab === 'digital' ? styles.tabOn : ''}`} onClick={() => setTab('digital')}>
            Digital Download
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
            Prints &amp; Products
          </button>
        </div>

        {tab === 'digital' && (
          <div className={styles.sideBody}>
            {image.noDownload ? (
              <div className={styles.buy}>
                <span className={styles.lineTitle}>Full-Resolution Download</span>
                <span className={styles.muted}>Downloads aren&rsquo;t offered for this album.</span>
              </div>
            ) : price == null ? (
              <div className={styles.buy}>
                <span className={styles.lineTitle}>
                  Full-Resolution Download<strong>Free</strong>
                </span>
                <span className={styles.muted}>Free for personal use.</span>
                <a className={styles.primary} href={image.downloadUrl ?? image.full} download onClick={() => setDownloaded(true)}>
                  {downloaded ? 'Downloaded ✓' : 'Download Photo'}
                </a>
              </div>
            ) : (
              <div className={styles.buy}>
                <div className={styles.option} aria-pressed="true">
                  <span className={styles.optionText}>
                    <strong>Personal Download</strong>
                    <span>Full resolution, personal use</span>
                  </span>
                  <strong>{dollars(price)}</strong>
                </div>
                <button type="button" className={styles.primary} disabled={inCart.includes(image.id)} onClick={addDownload}>
                  {inCart.includes(image.id) ? 'In Your Cart' : `Add to Cart · ${dollars(price)}`}
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
              <span className={styles.lineTitle}>Prints &amp; Products</span>
              <span className={styles.muted}>{image.printNote ?? 'Prints and products aren’t offered for this photo.'}</span>
            </div>
          </div>
        )}

        {tab === 'print' && image.printable !== false && !product && (!ready || products.length === 0) && (
          <div className={styles.sideBody}>
            <div className={styles.buy}>
              <span className={styles.lineTitle}>Prints &amp; Products</span>
              <span className={styles.muted} role="status">
                {ready ? 'Prints and products aren’t offered for this album.' : 'Loading prints and products…'}
              </span>
            </div>
          </div>
        )}

        {tab === 'print' && image.printable !== false && !product && ready && products.length > 0 && (
          <div className={styles.sideBody}>
            {PRINT_GROUPS.filter((group) => products.some((p) => p.group === group)).map((group) => (
              <div key={group} className={styles.group}>
                <span className={styles.label}>{group.toUpperCase()}</span>
                {products.filter((p) => p.group === group).map((p) => (
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
              <span className="glyph" aria-hidden>←</span> All Products
            </button>
            {/* Its front or its back, large: a click on it turns it over, as the switch under it does. */}
            <button
              ref={previewBox}
              type="button"
              className={styles.preview}
              aria-label={side === 'front' ? `Show the back of the ${product.name}` : `Show the front of the ${product.name}`}
              onClick={() => setSide(side === 'front' ? 'back' : 'front')}
            >
              <span className={styles.previewSide}>{side === 'front' ? 'FRONT' : 'BACK'}</span>
              <span key={`${side}-${product.id}`} className={styles.previewTurn}>
                <Mockup
                  product={product}
                  chosen={chosen}
                  src={image.src}
                  max={previewSize}
                  back={side === 'back'}
                  backPhoto={side === 'back' ? backs[printBackKey(product, chosen) ?? ''] : undefined}
                />
              </span>
              <span className={styles.previewHint} aria-hidden>
                ↻ {side === 'front' ? 'See the Back' : 'See the Front'}
              </span>
            </button>
            <div className={styles.sideSwitch} role="radiogroup" aria-label="Side">
              {(
                [
                  ['front', 'Front · your photo'],
                  ['back', 'Back'],
                ] as const
              ).map(([v, label]) => (
                <button key={v} type="button" role="radio" aria-checked={side === v} className={`${styles.sideBtn} ${side === v ? styles.sideOn : ''}`} onClick={() => setSide(v)}>
                  {label}
                </button>
              ))}
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
                Add to Cart · {dollars(unit * qty)}
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
