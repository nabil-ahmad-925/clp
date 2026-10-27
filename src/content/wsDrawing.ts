/**
 * Wholesale's drawings (components/shop/WsMock.tsx): the items' shapes and print spots, the metals, the graphics, the
 * lettering and what a brand asset is. Nothing else imported, so the admin shares the mockup (its scripts/
 * sync-widgets.mjs copies this file and WsMock.tsx) and draws a partner's items exactly as the site does.
 */
/** A product drawing on a 100×100 canvas, with its print spots: [x, y, width] of each spot's logo. */
export type WsShape = { d: string; d2: string; P: Record<string, [number, number, number]>; fixed?: string };
const TEE = 'M30 14 L42 10 Q50 19 58 10 L70 14 L88 30 L78 42 L70 37 L70 90 L30 90 L30 37 L22 42 L12 30 Z';
export const SHAPES: Record<string, WsShape> = {
  tee: { d: TEE, d2: 'M42 10 Q50 19 58 10', P: { front: [50, 36, 20], back: [50, 42, 32], sleeve: [80, 31, 8] } },
  hood: {
    d: 'M36 20 Q50 4 64 20 L72 22 L86 38 L94 76 L84 78 L74 50 L72 92 L28 92 L26 50 L16 78 L6 76 L14 38 L28 22 Z',
    d2: 'M40 22 Q50 34 60 22 M38 70 L62 70 L64 84 L36 84 Z',
    P: { front: [50, 46, 20], back: [50, 46, 30], sleeve: [85, 52, 7] },
  },
  polo: { d: TEE, d2: 'M42 10 L50 22 L58 10 M50 22 L50 32', P: { front: [62, 32, 11], back: [50, 42, 32], sleeve: [80, 31, 8] } },
  jersey: { d: 'M30 14 L42 10 L50 24 L58 10 L70 14 L86 28 L77 40 L70 36 L70 90 L30 90 L30 36 L23 40 L14 28 Z', d2: 'M42 10 L50 24 L58 10', P: { front: [50, 42, 20], back: [50, 46, 32], sleeve: [80, 30, 8] } },
  jacket: {
    d: 'M32 14 L42 10 Q50 16 58 10 L68 14 L84 34 L90 70 L80 72 L72 44 L72 90 L28 90 L28 44 L20 72 L10 70 L16 34 Z',
    d2: 'M50 14 L50 40 M42 10 L44 5 L56 5 L58 10',
    P: { front: [61, 30, 11], back: [50, 40, 32], sleeve: [85, 52, 8] },
  },
  pinnie: { d: 'M32 10 L42 10 Q50 20 58 10 L68 10 L74 32 L74 90 L26 90 L26 32 Z', d2: 'M42 10 Q50 20 58 10', P: { front: [50, 44, 24], back: [50, 46, 30] } },
  short: { d: 'M24 20 L76 20 L82 78 L56 80 L50 46 L44 80 L18 78 Z', d2: 'M24 28 L76 28', P: { leg: [31, 64, 11] } },
  sock: { d: 'M38 8 L62 8 L62 58 Q62 64 68 68 L82 76 Q90 82 84 90 Q80 94 70 92 L44 82 Q36 78 38 66 Z', d2: 'M38 20 L62 20', P: { cuff: [50, 36, 16] } },
  hat: { d: 'M20 62 Q20 26 50 24 Q80 26 80 62 Z M14 62 L90 62 Q92 72 68 72 L14 68 Z', d2: 'M50 24 L50 62', P: { front: [50, 46, 20], side: [70, 52, 9] } },
  bag: { d: 'M22 34 L78 34 L84 88 L16 88 Z', d2: 'M36 34 Q36 16 50 16 Q64 16 64 34', P: { front: [50, 60, 28] } },
  bottle: { d: 'M42 8 L58 8 L58 18 Q68 24 68 34 L68 90 Q68 94 64 94 L36 94 Q32 94 32 90 L32 34 Q32 24 42 18 Z', d2: 'M32 30 L68 30', P: { front: [50, 60, 22] } },
  medal: {
    d: 'M34 4 L46 4 L56 40 L44 40 Z M66 4 L54 4 L44 40 L56 40 Z M26 66 A24 24 0 1 0 74 66 A24 24 0 1 0 26 66 Z',
    d2: 'M31 66 A19 19 0 1 0 69 66 A19 19 0 1 0 31 66',
    P: { front: [50, 66, 20] },
    fixed: '#C9A44C',
  },
  tent: { d: 'M10 44 L50 16 L90 44 Z M10 44 L90 44 L90 54 L10 54 Z', d2: 'M14 54 L14 92 M86 54 L86 92 M50 16 L50 44', P: { valance: [50, 49, 16], canopy: [50, 35, 18] } },
  arch: { d: 'M12 92 L12 50 Q12 12 50 12 Q88 12 88 50 L88 92 L72 92 L72 52 Q72 30 50 30 Q28 30 28 52 L28 92 Z', d2: '', P: { top: [50, 21, 18] } },
  banner: { d: 'M12 24 L88 24 L88 70 L12 70 Z', d2: 'M12 24 L12 94 M88 24 L88 94', P: { front: [50, 47, 30] } },
  flag: { d: 'M38 8 Q72 8 68 48 L62 88 L38 88 Z', d2: 'M38 8 L38 96', P: { front: [52, 38, 20] } },
};
/**
 * A brand asset: a badge (a monogram on a colour), a wordmark, or an image (an upload). Approved (ok), in review, or
 * new (needs approval).
 */
export type WsAsset = { id: string; name: string; kind: 'badge' | 'word' | 'img'; mono?: string; bg?: string; word?: string; src?: string; status: 'ok' | 'review' | 'new'; vector?: boolean; px?: number };
export const METALS: [string, string][] = [
  ['#C9A44C', 'Antique gold'],
  ['#B9BBBE', 'Silver'],
  ['#A2673C', 'Bronze'],
];
export const isLightColor = (c: string) => ['#F4F4F2', '#DCBD7D', '#C9A44C'].includes(c);

/** Sport and team graphics (24×24 paths). */
export const GICON: Record<string, [string, string]> = {
  star: ['Star', 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z'],
  bolt: ['Lightning', 'M13 2 3 14h7l-1 8 10-12h-7z'],
  ball: ['Soccer ball', 'M12 2a10 10 0 1 0 .01 0zM12 7.2l3.9 2.8-1.5 4.6h-4.8L8.1 10z'],
  trophy: ['Trophy', 'M7 3h10v3h3v2a4 4 0 0 1-4 4h-.4A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.4 12H8a4 4 0 0 1-4-4V6h3zM6 8v.1A2 2 0 0 0 7 10V8zm11 0v2a2 2 0 0 0 1-1.9V8z'],
  heart: ['Heart', 'M12 21 3.5 12.7A5 5 0 0 1 12 6a5 5 0 0 1 8.5 6.7z'],
  shield: ['Crest', 'M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z'],
  crown: ['Crown', 'M3 18h18l-1.6-10-4.4 4-3-7-3 7-4.4-4zM3 20h18v2H3z'],
  ribbon: ['Banner', 'M1 8h22l-3.5 4L23 16H1l3.5-4z'],
  laurel: ['Mountain', 'M2 20 9 8l4 6 3-4 6 10z'],
  flag: ['Flag', 'M5 2h2v20H5zM8 3h11l-3 4 3 4H8z'],
  city: ['Skyline', 'M2 21V11h4V6h4v5h2V3h4v8h2V8h4v13z'],
  fist: ['Hashtag', 'M9 3h2l-.6 4h4l.6-4h2l-.6 4H20v2h-3.9l-.6 4H19v2h-3.8l-.6 4h-2l.6-4h-4l-.6 4H7l.6-4H4v-2h3.9l.6-4H5V7h3.8z'],
};
/** The studio's lettering. */
export const WS_FONTS: Record<string, [string, string, string]> = {
  block: ['Block', "var(--font-montserrat), 'Montserrat', 'Archivo', sans-serif", 'normal'],
  varsity: ['Varsity', "'Courier New', Courier, monospace", 'normal'],
  script: ['Script', "var(--font-playfair), 'Playfair Display', Georgia, serif", 'italic'],
  classic: ['Classic', "Georgia, 'Times New Roman', serif", 'normal'],
};
