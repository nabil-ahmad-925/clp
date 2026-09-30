'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GalleryImage } from '@/content/types';
import GalleryLightbox from './GalleryLightbox';
import styles from './PhotoGallery.module.css';

type Props = { id: string; name: string; breadcrumbs: { label: string; href?: string }[]; images: GalleryImage[] };

// NextGEN Pro Mosaic settings on the original: 200px target rows, 5px margins (also used as the outer border).
const ROW_HEIGHT = 200;
const MARGIN = 5;
const BORDER = 5;
const JUSTIFY_THRESHOLD = 0.9;
/** Content width of the original's desktop column, used until the real width is measured. */
const DEFAULT_WIDTH = 1244.5;

type Box = { left: number; top: number; width: number; height: number };

/**
 * Justified-gallery layout, as the original's mosaic computes it: a row is closed as soon as adding the next photo
 * would bring it under the target height, then scaled to fill the width. The last (unfilled) row keeps the average
 * height of the rows above and is centred.
 */
function layout(images: GalleryImage[], galleryWidth: number) {
  const boxes: Box[] = [];
  let top = BORDER;
  let rows = 0;
  let row: number[] = [];
  let rowAspect = 0;

  const flush = (isLast: boolean) => {
    const available = galleryWidth - 2 * BORDER - (row.length - 1) * MARGIN;
    let height = available / rowAspect;
    let justify = true;
    const justifiable = (rowAspect * ROW_HEIGHT) / available > JUSTIFY_THRESHOLD;
    if (isLast && !justifiable) {
      height = rows > 0 ? (top - BORDER - MARGIN * rows) / rows : ROW_HEIGHT;
      justify = (height * rowAspect) / available > JUSTIFY_THRESHOLD;
      if (justify) height = available / rowAspect;
    }
    const widths = row.map((i) => Math.round((images[i].width / images[i].height) * height));
    if (justify) widths[widths.length - 1] = available - widths.slice(0, -1).reduce((a, b) => a + b, 0);
    const used = widths.reduce((a, b) => a + b, 0) + (row.length - 1) * MARGIN;
    let left = justify ? BORDER : (galleryWidth - used) / 2;
    row.forEach((i, n) => {
      boxes[i] = { left, top, width: widths[n], height };
      left += widths[n] + MARGIN;
    });
    top += height + MARGIN;
    rows += 1;
    row = [];
    rowAspect = 0;
  };

  images.forEach((image, i) => {
    const available = galleryWidth - 2 * BORDER - (row.length - 1) * MARGIN;
    const aspect = image.width / image.height;
    row.push(i);
    rowAspect += aspect;
    if (available / (rowAspect + aspect) < ROW_HEIGHT) flush(false);
  });
  if (row.length) flush(true);

  return { boxes, height: top - MARGIN + BORDER };
}

/** A gallery page: NextGEN breadcrumbs, the justified photo mosaic, and the full-screen lightbox. */
export default function PhotoGallery({ id, name, breadcrumbs, images }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [measured, setMeasured] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setWidth(el.getBoundingClientRect().width);
      setMeasured(true);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { boxes, height } = useMemo(() => layout(images, width), [images, width]);

  // Deep links: the original keeps the open photo in the hash (#gallery/<gallery id>/<image id>).
  const hashFor = useCallback((index: number) => `#gallery/${id}/${images[index].id}`, [id, images]);
  useEffect(() => {
    const match = window.location.hash.match(/^#gallery\/([^/]+)\/([^/]+)/);
    if (!match || match[1] !== id) return;
    const index = images.findIndex((image) => image.id === match[2]);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the photo named in the URL on arrival
    if (index >= 0) setOpen(index);
  }, [id, images]);

  const show = useCallback(
    (index: number) => {
      setOpen(index);
      window.history.replaceState(null, '', hashFor(index));
    },
    [hashFor],
  );

  const close = useCallback(() => {
    setOpen(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  return (
    <div>
      <ul className={styles.breadcrumbs}>
        {breadcrumbs.map((crumb, i) => (
          <li key={i}>
            {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
            {i < breadcrumbs.length - 1 && <span className={styles.divisor}> &raquo; </span>}
          </li>
        ))}
      </ul>
      <div ref={ref} className={styles.mosaic} style={{ height }} aria-label={name}>
        {images.map((image, i) => {
          const box = boxes[i];
          return (
            <div
              key={image.id}
              className={`${styles.item} ${measured ? styles.visible : ''}`}
              style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
            >
              <a
                href={image.full}
                title=""
                onClick={(e) => {
                  e.preventDefault();
                  show(i);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- the original 400px-high mosaic file */}
                <img src={image.src} alt={image.alt} title={image.alt} width={image.width} height={image.height} loading={i < 12 ? 'eager' : 'lazy'} />
              </a>
            </div>
          );
        })}
      </div>
      {open !== null && <GalleryLightbox galleryId={id} images={images} index={open} onIndex={show} onClose={close} />}
    </div>
  );
}
