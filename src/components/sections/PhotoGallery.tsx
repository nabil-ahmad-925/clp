'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { albumName } from '@/content/gallery';
import type { GalleryImage } from '@/content/types';
import GalleryLightbox from './GalleryLightbox';
import styles from './PhotoGallery.module.css';

type Props = { id: string; name: string; breadcrumbs: { label: string; href?: string }[]; images: GalleryImage[] };

/**
 * An album page (new design's event album): the breadcrumb, its label, name and photo count, then the photos as a
 * masonry grid; a photo opens the full-screen viewer. The open photo is kept in the URL (#gallery/<id>/<photo id>), so
 * a link to it opens it.
 */
export default function PhotoGallery({ id, name, breadcrumbs, images }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const title = albumName(name);

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
    <section className={styles.album}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
        {breadcrumbs.map((crumb, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <span className={styles.divisor} aria-hidden>
                ›
              </span>
            )}
            {crumb.href ? (
              <Link href={crumb.href}>{crumb.label.trim()}</Link>
            ) : (
              <span aria-current="page">{albumName(crumb.label)}</span>
            )}
          </Fragment>
        ))}
      </nav>

      <div className={styles.head}>
        <span className={styles.badge}>PUBLIC</span>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.meta}>
          {images.length} {images.length === 1 ? 'photo' : 'photos'} · Photos by Compete Like Pros
        </span>
      </div>

      <div className={styles.grid} aria-label={`${title} photos`}>
        {images.map((image, i) => (
          <a
            key={image.id}
            href={image.full}
            className={styles.photo}
            aria-label={`Open photo ${i + 1} of ${images.length}`}
            onClick={(e) => {
              e.preventDefault();
              show(i);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the original 400px-high gallery file */}
            <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading={i < 12 ? 'eager' : 'lazy'} />
          </a>
        ))}
      </div>

      {open !== null && <GalleryLightbox galleryId={id} albumTitle={title} images={images} index={open} onIndex={show} onClose={close} />}
    </section>
  );
}
