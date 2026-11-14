import { uploadGuestImage } from '@/content/bulk';
import { imageDataUrl } from './useStudio';

/**
 * A guest's (or member's) images for their quote, kept with their cart (POST /cart/<id>/images). An image starts
 * uploading when it's picked (preloadGuestImage), so Send only waits for what's left: the same image is never
 * uploaded twice in a visit, and one that failed is tried again on the next ask.
 */
const uploads = new Map<string, Promise<string>>();
// The size a guest's image goes up at: a preview (print files come through Production files).
const MAX_PX = 1200;
const MAX_BYTES = 200_000;

/** The image's link: already one (https), or its upload (started now, or earlier by preloadGuestImage). */
export function guestImage(src: string): Promise<string> {
  if (/^https:\/\//.test(src)) return Promise.resolve(src);
  let p = uploads.get(src);
  if (!p) {
    p = imageDataUrl(src, MAX_PX, MAX_BYTES).then(uploadGuestImage);
    uploads.set(src, p);
    // A failed one isn't kept: the next ask tries again.
    p.catch(() => uploads.delete(src));
  }
  return p;
}

/** Starts the upload in the background as soon as it's picked (its error waits for Send to show). */
export function preloadGuestImage(src: string | undefined) {
  if (src && !/^https:\/\//.test(src)) guestImage(src).catch(() => undefined);
}
