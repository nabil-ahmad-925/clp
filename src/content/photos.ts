import 'server-only';
import { albumName, type AlbumAccess } from './gallery';
import type { BuilderPage, GalleryImage } from './types';
import { pageStore } from './data';
import photos from './data/photos.json';

/**
 * The sport photo albums under /experiences/ (e.g. /experiences/baseball/photos/) and their galleries
 * (…/photos/nggallery/album/<gallery>/), rebuilt from the original NextGEN album and mosaic pages.
 */
const store = pageStore<BuilderPage>(photos as Record<string, Omit<BuilderPage, 'path'>>);

/** Photo page for a site path such as "/experiences/baseball/photos/". */
export const getPhotoPage = store.get;

/** All photo page paths (for static generation and the sitemap). */
export const photoPaths = store.paths;

/** One of a sport's photo albums, as the photo pages list it (content/gallery.ts names it). */
export type PhotoAlbumRef = {
  /** Its address' last segment ("futbol-soccer-advancement-workshops"): the category page's ?category=. */
  slug: string;
  /** "Fútbol (Soccer) Advancement & Workshops". */
  title: string;
  /** "Advancement & Workshops". */
  category: string;
  href: string;
  image: string;
  count: number;
  access: AlbumAccess;
};

/** What a photo page shows (components/photos/PhotoExplorer): its sport, the sport's albums, and on an album page that album. */
export type PhotoSection = {
  sport: { title: string; href: string };
  albums: PhotoAlbumRef[];
  album?: { slug: string; id: string; title: string; category: string; images: GalleryImage[]; access: AlbumAccess };
};

const slugOf = (href: string) => href.split('/').filter(Boolean).at(-1) ?? href;
/** "Fútbol (Soccer)" from "Fútbol (Soccer) - ADVANCEMENT & WORKSHOPS". */
const sportOf = (title: string) => (title.includes(' - ') ? title.slice(0, title.indexOf(' - ')).trim() : '');
const blocksOf = (page: BuilderPage) => page.rows.flatMap((row) => row.columns.flatMap((col) => col.blocks));

/** A sport photo page's albums. */
function albumsOf(page: BuilderPage): PhotoAlbumRef[] {
  const block = blocksOf(page).find((b) => b.type === 'album');
  if (block?.type !== 'album') return [];
  return block.items.map((item) => {
    const category = albumName(item.title);
    const sport = sportOf(item.title);
    return {
      slug: slugOf(item.href),
      title: sport ? `${sport} ${category}` : category,
      category,
      href: item.href,
      image: item.image,
      count: item.count,
      access: item.access ?? 'public',
    };
  });
}

/** A photo page's section: a sport's photo page (its albums) or an album page (with the sport's albums); else undefined. */
export function photoSectionOf(page: BuilderPage): PhotoSection | undefined {
  const blocks = blocksOf(page);
  if (blocks.some((b) => b.type === 'album')) {
    return { sport: { title: page.hero?.title.join(' ') ?? 'Photos', href: page.path }, albums: albumsOf(page) };
  }
  const gallery = blocks.find((b) => b.type === 'gallery');
  if (gallery?.type !== 'gallery') return undefined;
  const sportHref = gallery.breadcrumbs[0]?.href ?? '/';
  const sportPage = getPhotoPage(sportHref);
  const albums = sportPage ? albumsOf(sportPage) : [];
  const slug = slugOf(page.path);
  const ref = albums.find((a) => a.slug === slug);
  const category = ref?.category ?? albumName(gallery.name);
  return {
    sport: { title: sportPage?.hero?.title.join(' ') ?? gallery.breadcrumbs[0]?.label.trim() ?? 'Photos', href: sportHref },
    albums,
    album: { slug, id: gallery.id, title: ref?.title ?? category, category, images: gallery.images, access: gallery.access ?? ref?.access ?? 'public' },
  };
}
