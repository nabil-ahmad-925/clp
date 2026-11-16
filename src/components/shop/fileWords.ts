import type { ProductionFile } from '@/content/bulk';

/**
 * A production file in the client's words on Quote Requests (clp-api shared/file-review.mjs decides): where it stands,
 * why we asked for a new one, what our change was, and each version's tag in their history. Pure.
 */
type Version = ProductionFile['versions'][number];

export const FILE_STATUS: Record<ProductionFile['status'], [string, string, string]> = {
  missing: ['Needed', '#FBF3E2', '#8A6F33'],
  review: ['We’re checking it', '#F2F1ED', '#444444'],
  approved: ['Approved', '#E7F3EC', '#1E7A45'],
  changes: ['Send a new one', '#FBEAE8', '#B03A2E'],
  clp: ['We’re making it', '#F2F1ED', '#444444'],
  optional: ['Optional', '#F2F1ED', '#666666'],
  client: ['Please approve our change', '#111111', '#FFFFFF'],
  declined: ['We’re updating it', '#F2F1ED', '#444444'],
};

export const REASON: Record<NonNullable<ProductionFile['reason']>, string> = {
  vector: 'It needs to be a vector file',
  resolution: 'It needs a higher resolution',
  color: 'Its colors need adjusting for production',
  background: 'Its background needs removing',
  info: 'We need a little more information',
  other: 'We need a new file',
};

const CHANGE: Record<NonNullable<Version['change']>, string> = {
  'as-sent': 'Your file, sent to us another way',
  format: 'File format or size only',
  technical: 'Technical fix',
  design: 'Design change',
};
/** What our change was, for the approval line. */
export const changeWords = (v?: Version) => (v?.change ? CHANGE[v.change] : 'Updated by our team');

/** A version's tag in their history. */
export function versionTag(f: Pick<ProductionFile, 'status' | 'versions'>, v: Version, i: number): string {
  if (v.by === 'client') return i === 0 ? 'Your original' : 'From you';
  const what = v.change ? CHANGE[v.change] : 'Added by our team';
  if (v.clientApproval) return `${what} · approved ${v.clientApproval.by === 'client' ? 'by you' : 'by you (by e-mail or phone)'}`;
  if (i === f.versions.length - 1 && f.status === 'client') return `${what} · waiting for your approval`;
  return what;
}

/** A version the browser can draw: a PNG or JPG they uploaded (served inline), or a link straight to one. */
export const isPicture = (v?: Version) => Boolean(v?.url) && (/\.(png|jpe?g)$/i.test(v?.name ?? '') || /\.(png|jpe?g)$/i.test(v?.url?.split(/[?#]/)[0] ?? ''));
/** A version's type for its preview card: "SVG", "PDF", or LINK for another site's page. */
export const typeOf = (v: Version) => /\.([a-z0-9]{2,4})$/i.exec(v.name)?.[1]?.toUpperCase() ?? 'LINK';
/** The picture of their logo to draw on the item: the newest picture among the logo files, in this order. */
export function logoPicture(files: Partial<Record<string, ProductionFile>>, keys = ['png', 'vector', 'small']): Version | undefined {
  for (const k of keys) {
    const v = files[k]?.versions.at(-1);
    if (isPicture(v)) return v;
  }
  return undefined;
}

/** What their file is, in words, and a heads-up when it's small: "PNG, 900 × 700 px, may be too small (we'll check it)". */
export function infoWords(v?: Version): string {
  const i = v?.info;
  if (!i) return '';
  const ext = /\.([a-z0-9]{2,4})$/i.exec(v.name)?.[1]?.toUpperCase() ?? '';
  const what = i.kind === 'vector' ? `${ext}, a vector file (best for production)` : [ext, i.width ? `${i.width} × ${i.height} px` : '', i.dpi ? `${i.dpi} dpi` : ''].filter(Boolean).join(', ');
  return i.low ? `${what}. It may be too small to print sharply, we’ll check it` : what;
}
