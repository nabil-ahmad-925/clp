import 'server-only';
import { upload } from './site';

/**
 * Helpers for the generated JSON in ./data (extracted from the archived WordPress pages).
 * Images there are stored as "upload:/YYYY/MM/file" and resolved here via upload().
 */
const UPLOAD_REF = /upload:(\/[^"'\s)]+)/g;

/** Replaces every "upload:/..." reference (whole values and inside HTML) with its served URL. */
export function resolveUploads<T>(value: T): T {
  if (typeof value === 'string') return value.replace(UPLOAD_REF, (_, p: string) => upload(p)) as T;
  if (Array.isArray(value)) return value.map(resolveUploads) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveUploads(v)])) as T;
  }
  return value;
}

/** Path-keyed lookup over one or more generated JSON maps, adding each entry's `path`. */
export function pageStore<T extends { path: string }>(...maps: Record<string, Omit<T, 'path'>>[]) {
  const pages = new Map<string, T>();
  for (const map of maps) for (const [path, page] of Object.entries(map)) pages.set(path, { path, ...page } as T);
  return {
    get: (path: string): T | undefined => {
      const page = pages.get(path);
      return page && resolveUploads(page);
    },
    paths: [...pages.keys()],
  };
}
