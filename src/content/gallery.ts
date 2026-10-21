/**
 * The photo pages (new design: albums, viewer and print on demand). Albums, photos and HD prices come from the site's
 * gallery data; who may see an album (`access`), the print products and their prices are set here.
 */

/**
 * An album's name as the photo pages show it: without the sport in front ("Fútbol (Soccer) - ADVANCEMENT & WORKSHOPS"
 * -> "Advancement & Workshops"; "Baseball - Leagues / Social Clubs " -> "Leagues / Social Clubs"), all-caps names in
 * title case.
 */
export function albumName(title: string) {
  // "Camps / Tournaments" reads "Camps & Tournaments".
  const name = (title.includes(' - ') ? title.slice(title.indexOf(' - ') + 3) : title).trim().replace(/\s*\/\s*/g, ' & ');
  if (name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s/(&-])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/** The line under the sport photo pages' heading. */
export const PHOTOS_BLURB = 'Find your shot from CLP events, games and tournaments. Download it, or turn it into a print, canvas or keepsake.';

/**
 * Who may see an album: everyone (public), people with its access code, families of its (youth) players, or the
 * client it was shot for. Albums without one are public.
 */
export type AlbumAccess = 'public' | 'code' | 'family' | 'client';
export const ACCESS: Record<AlbumAccess, { label: string; bg: string; fg: string; lock?: string }> = {
  public: { label: 'PUBLIC', bg: '#FFFFFF', fg: '#111111' },
  code: { label: 'PRIVATE · CODE', bg: '#111111', fg: '#FFFFFF', lock: 'Code required' },
  family: { label: 'FAMILIES ONLY', bg: '#1B4F8C', fg: '#FFFFFF', lock: 'Families only' },
  client: { label: 'CLIENT GALLERY', bg: '#DCBD7D', fg: '#000000', lock: 'Client login' },
};

/** A print product option: a list of sizes (each its own price), segments, colour swatches or a menu. */
export type PrintOption = {
  id: string;
  label: string;
  type: 'list' | 'seg' | 'swatch' | 'select';
  options: { value: string; label: string; price?: number; swatch?: string }[];
};
export type PrintProduct = {
  id: string;
  group: 'Wall art' | 'Home & drinkware' | 'Wear & carry';
  name: string;
  desc: string;
  /** The preview's shape (width / height) when its first option isn't a size, its corners and shadow. */
  ratio?: string;
  radius: string;
  frame?: boolean;
  /**
   * What its back looks like (shown beside its front in the configurator): a canvas' stretcher bars, the metal's mount,
   * the frame's backing, a poster's paper, the far side of a full-wrap print, a blanket's fleece or sherpa, a garment's
   * blank back, a phone case's inside, or a sticker's liner.
   */
  back: 'canvas' | 'metal' | 'frame' | 'paper' | 'wrap' | 'fabric' | 'garment' | 'case' | 'liner';
  ships: string;
  options: PrintOption[];
};

/** Sizes "8 × 10" in inches, each with its price. */
const sizes = (list: [string, number][]): PrintOption => ({ id: 'size', label: 'Size', type: 'list', options: list.map(([value, price]) => ({ value, label: `${value} in`, price })) });
const seg = (id: string, label: string, values: string[]): PrintOption => ({ id, label, type: 'seg', options: values.map((v) => ({ value: v, label: v })) });

/**
 * The print-on-demand catalog (the design's products). SAMPLE PRICES for the UI: set the print partner's real prices
 * (and its shipping times) here before launch.
 */
export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    id: 'canvas',
    group: 'Wall art',
    name: 'Canvas',
    desc: 'Gallery-wrapped canvas, ready to hang.',
    radius: '2px',
    back: 'canvas',
    ships: '3–5 business days',
    options: [
      sizes([['8 × 10', 39], ['11 × 14', 49], ['16 × 20', 69], ['20 × 30', 99], ['24 × 36', 129], ['30 × 40', 169], ['40 × 60', 249]]),
      seg('depth', 'Depth', ['0.75 in', '1.5 in']),
      seg('edge', 'Edge', ['Image wrap', 'Mirror', 'White']),
    ],
  },
  {
    id: 'metal',
    group: 'Wall art',
    name: 'Metal print',
    desc: 'Dye-infused aluminum. Vivid color, waterproof.',
    radius: '4px',
    back: 'metal',
    ships: '5–7 business days',
    options: [
      sizes([['8 × 12', 45], ['12 × 18', 69], ['16 × 24', 99], ['20 × 30', 139], ['24 × 36', 179], ['30 × 45', 259]]),
      seg('finish', 'Finish', ['Gloss', 'Matte']),
      seg('mount', 'Hanging', ['Float mount', 'Easel back']),
    ],
  },
  {
    id: 'framed',
    group: 'Wall art',
    name: 'Framed print',
    desc: 'Archival print in a wood frame.',
    radius: '0',
    frame: true,
    back: 'frame',
    ships: '4–6 business days',
    options: [
      sizes([['8 × 10', 49], ['11 × 14', 69], ['16 × 20', 99], ['18 × 24', 129], ['24 × 36', 189]]),
      {
        id: 'frame',
        label: 'Frame',
        type: 'swatch',
        options: [
          { value: 'Black', label: 'Black', swatch: '#111111' },
          { value: 'White', label: 'White', swatch: '#F4F4F4' },
          { value: 'Oak', label: 'Oak', swatch: '#B08A5B' },
          { value: 'Walnut', label: 'Walnut', swatch: '#5C3F2A' },
        ],
      },
      seg('mat', 'Mat', ['No mat', 'White mat']),
    ],
  },
  {
    id: 'poster',
    group: 'Wall art',
    name: 'Poster',
    desc: 'Museum-grade paper, unframed.',
    radius: '0',
    back: 'paper',
    ships: '3–5 business days',
    options: [sizes([['12 × 18', 19], ['18 × 24', 29], ['24 × 36', 39]]), seg('paper', 'Paper', ['Matte', 'Satin'])],
  },
  {
    id: 'mug',
    group: 'Home & drinkware',
    name: 'Drinkware',
    desc: 'Full-wrap print, dishwasher safe.',
    ratio: '2.3 / 1',
    radius: '10px',
    back: 'wrap',
    ships: '3–5 business days',
    options: [
      {
        id: 'item',
        label: 'Item',
        type: 'list',
        options: [
          { value: '11 oz mug', label: '11 oz mug', price: 19 },
          { value: '15 oz mug', label: '15 oz mug', price: 22 },
          { value: '20 oz tumbler', label: '20 oz tumbler', price: 32 },
          { value: 'Water bottle', label: 'Water bottle', price: 34 },
        ],
      },
      {
        id: 'color',
        label: 'Color',
        type: 'swatch',
        options: [
          { value: 'White', label: 'White', swatch: '#FFFFFF' },
          { value: 'Black', label: 'Black', swatch: '#111111' },
        ],
      },
    ],
  },
  {
    id: 'blanket',
    group: 'Home & drinkware',
    name: 'Blanket',
    desc: 'Soft throw with an edge-to-edge print.',
    radius: '12px',
    back: 'fabric',
    ships: '5–7 business days',
    options: [sizes([['50 × 60', 59], ['60 × 80', 79]]), seg('material', 'Material', ['Fleece', 'Sherpa'])],
  },
  {
    id: 'tee',
    group: 'Wear & carry',
    name: 'Apparel',
    desc: 'Your photo printed on soft blanks.',
    ratio: '1 / 1',
    radius: '4px',
    back: 'garment',
    ships: '4–7 business days',
    options: [
      {
        id: 'item',
        label: 'Item',
        type: 'seg',
        options: [
          { value: 'Tee', label: 'Tee', price: 29 },
          { value: 'Long sleeve', label: 'Long sleeve', price: 35 },
          { value: 'Hoodie', label: 'Hoodie', price: 55 },
        ],
      },
      {
        id: 'color',
        label: 'Color',
        type: 'swatch',
        options: [
          { value: 'White', label: 'White', swatch: '#FFFFFF' },
          { value: 'Black', label: 'Black', swatch: '#111111' },
          { value: 'Heather gray', label: 'Heather gray', swatch: '#B5B5B5' },
          { value: 'Maroon', label: 'Maroon', swatch: '#7A1F2B' },
        ],
      },
      seg('size', 'Size', ['S', 'M', 'L', 'XL', '2XL']),
    ],
  },
  {
    id: 'case',
    group: 'Wear & carry',
    name: 'Phone case',
    desc: 'Impact-resistant case with a glossy print.',
    ratio: '1 / 2',
    radius: '18px',
    back: 'case',
    ships: '3–5 business days',
    options: [
      {
        id: 'model',
        label: 'Phone model',
        type: 'select',
        options: ['iPhone 16 Pro', 'iPhone 16', 'iPhone 15', 'Samsung Galaxy S25', 'Google Pixel 9'].map((v) => ({ value: v, label: v, price: 29 })),
      },
      {
        id: 'type',
        label: 'Type',
        type: 'seg',
        options: [
          { value: 'Slim', label: 'Slim' },
          { value: 'Tough', label: 'Tough', price: 10 },
        ],
      },
    ],
  },
  {
    id: 'sticker',
    group: 'Wear & carry',
    name: 'Stickers',
    desc: 'Weatherproof vinyl, die-cut.',
    ratio: '1 / 1',
    radius: '14px',
    back: 'liner',
    ships: '2–4 business days',
    options: [
      seg('size', 'Size', ['3 in', '4 in', '5 in']),
      {
        id: 'pack',
        label: 'Pack',
        type: 'seg',
        options: [
          { value: '1', label: '1', price: 5 },
          { value: '5', label: '5', price: 15 },
          { value: '10', label: '10', price: 25 },
        ],
      },
    ],
  },
];

/**
 * The back photo a product shows with these options (clp-api's print backs): a canvas' by its depth, a metal print's by
 * its hanging, a blanket's by its material, a garment's by its colour; none for drinkware (its back is the photo's
 * other side).
 */
export function printBackKey(product: PrintProduct, chosen: Record<string, string>): string | undefined {
  const slug = (v = '') => v.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  switch (product.back) {
    case 'canvas':
      return chosen.depth === '1.5 in' ? 'canvas-150' : 'canvas-075';
    case 'metal':
      return chosen.mount === 'Easel back' ? 'metal-easel' : 'metal-float';
    case 'frame':
      return 'frame';
    case 'paper':
      return 'poster';
    case 'fabric':
      return chosen.material === 'Sherpa' ? 'blanket-sherpa' : 'blanket-fleece';
    case 'garment':
      return `tee-${slug(chosen.color ?? 'White')}`;
    case 'case':
      return 'case';
    case 'liner':
      return 'sticker';
    default:
      return undefined;
  }
}

/** The product groups, in the design's order. */
export const PRINT_GROUPS: PrintProduct['group'][] = ['Wall art', 'Home & drinkware', 'Wear & carry'];

/**
 * A product's price for the chosen options: its priced option's price (the size, item, model or pack), plus any other
 * chosen option's extra (e.g. a tough case).
 */
export function printPrice(product: PrintProduct, chosen: Record<string, string>) {
  let base = 0;
  let extra = 0;
  product.options.forEach((o, i) => {
    const option = o.options.find((x) => x.value === chosen[o.id]) ?? o.options[0];
    if (option.price == null) return;
    if (i === product.options.findIndex((p) => p.options.some((x) => x.price != null))) base = option.price;
    else extra += option.price;
  });
  return base + extra;
}

/** A product's lowest price ("from $39"). */
export const printFrom = (product: PrintProduct) => {
  const priced = product.options.find((o) => o.options.some((x) => x.price != null));
  return priced ? Math.min(...priced.options.map((x) => x.price ?? Infinity)) : 0;
};

/** The preview's shape (width / height) for the chosen size ("16 × 20" -> "16 / 20"), else the product's. */
export function printRatio(product: PrintProduct, chosen: Record<string, string>) {
  const size = product.options.find((o) => o.id === 'size' && o.type === 'list');
  const value = size ? (chosen.size ?? size.options[0].value) : '';
  const m = value.match(/^(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)/);
  return m ? `${m[1]} / ${m[2]}` : (product.ratio ?? '4 / 5');
}

/** CLP's settings for a print product (clp-api GET /albums/print-products: the admin's Shop & products → Photo products). */
export type PrintCatalogEntry = {
  id: string;
  name: string;
  group: PrintProduct['group'];
  description: string;
  live: boolean;
  /** What a family pays for its first option. */
  suggested: number;
  /** Every album, only the listed partners' albums, or the CLP Shop only (never on album pages). */
  where: 'all' | 'partners' | 'shop';
  partners: string[];
};

/**
 * The print products as CLP set them up (Photo products): only the live ones that show on this album (every album, or
 * the partners' albums `partner` is one of; never the shop-only ones), with CLP's name, description and group, and its
 * suggested price for the first option (the other options keep their price differences). Without CLP's settings (not
 * loaded, or a product CLP never saved), the catalog above as it is.
 */
export function withCatalog(entries: PrintCatalogEntry[] | null, partner?: string): PrintProduct[] {
  if (!entries) return PRINT_PRODUCTS;
  const byId = new Map(entries.map((e) => [e.id, e]));
  return PRINT_PRODUCTS.flatMap((p) => {
    const e = byId.get(p.id);
    if (!e) return [p];
    if (!e.live || e.where === 'shop' || (e.where === 'partners' && !(partner && e.partners.includes(partner)))) return [];
    const priced = p.options.findIndex((o) => o.options.some((x) => x.price != null));
    const shift = e.suggested > 0 ? Math.round((e.suggested - printFrom(p)) * 100) / 100 : 0;
    return [
      {
        ...p,
        name: e.name || p.name,
        desc: e.description || p.desc,
        group: PRINT_GROUPS.includes(e.group) ? e.group : p.group,
        options: shift
          ? p.options.map((o, i) =>
              i !== priced ? o : { ...o, options: o.options.map((x) => (x.price == null ? x : { ...x, price: Math.max(0, Math.round((x.price + shift) * 100) / 100) })) },
            )
          : p.options,
      },
    ];
  });
}

/** "$39" or "$39.50". */
export const dollars = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
