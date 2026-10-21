'use client';
/* eslint-disable @next/next/no-img-element -- the partner's own logo (their upload or file), shown as it is. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  ADDONS,
  BULK_CATEGORIES,
  BULK_ITEMS,
  COLOR_NAMES,
  FONTS,
  LOCATIONS,
  PALETTE,
  PATTERNS,
  PLACES,
  PMS,
  SPECIALTY,
  TEMPLATES,
  VIEWS,
  bulkItem,
  categoryOf,
  createDesign,
  decorationRule,
  isApparel,
  myDesigns,
  printInches,
  sendGuestQuote,
  updateDesign,
  uploadGuestImage,
  type BulkItem,
  type BulkKind,
  type StudioDesign,
} from '@/content/bulk';
import { uploadImage } from '@/content/partnerSession';
import { shopHref } from '@/content/storefront';
import Mockup, { FONT_STYLE, isLight, mockupPng, saveFile } from './Mockup';
import { Chevron, LockIcon } from './shopIcons';
import { studioFontVariables } from './studioFonts';
import { SAMPLE_LOGO, imageDataUrl, useStudio, type StudioBrand } from './useStudio';
import st from './studio.module.css';

type Tab = 'prod' | 'tpl' | 'color' | 'pat' | 'logo' | 'text' | 'back';
type Art = { name: string; kind: 'vector' | 'raster' | 'bad'; w?: number; h?: number; master?: boolean } | null;

/** The CSS preview of a pattern (template and pattern tiles), as the design draws them. */
export const patternCss = (p: string, base: string, acc: string) =>
  (
    ({
      pin: `repeating-linear-gradient(90deg, ${acc} 0 2px, ${base} 2px 12px)`,
      split: `linear-gradient(90deg, ${base} 50%, ${acc} 50%)`,
      none: base,
      stripes: `repeating-linear-gradient(90deg, ${acc} 0 6px, ${base} 6px 16px)`,
      hoops: `repeating-linear-gradient(0deg, ${base} 0 14px, ${acc} 14px 24px)`,
      sash: `linear-gradient(115deg, ${base} 40%, ${acc} 40% 58%, ${base} 58%)`,
      fade: `linear-gradient(180deg, ${base}, ${acc})`,
      chest: `linear-gradient(180deg, ${base} 30%, ${acc} 30% 48%, ${base} 48%)`,
    }) as Record<string, string>
  )[p] ?? base;

const colorName = (c: string) => COLOR_NAMES[c.toUpperCase()] ?? c.toUpperCase();

/** A fresh design for an item in the partner's brand. */
function freshDesign(item: BulkItem, brand: StudioBrand): StudioDesign {
  const k = brand.kit;
  const colors = k.colors.length ? k.colors : [brand.color];
  return {
    base: k.locked ? colors[0] : brand.color,
    accent: k.locked ? (colors[1] ?? colors[0]) : '#DCBD7D',
    pattern: 'none',
    trim: true,
    logoOn: true,
    logo: brand.logo,
    place: k.locked && k.places.length && !k.places.includes('center') ? k.places[0] : 'center',
    logoScale: 1,
    dx: 0,
    dy: 0,
    text: '',
    font: k.locked && k.fonts.length ? k.fonts[0] : 'mont',
    textColor: '',
    textPlace: 'below',
    textScale: 1,
    playerName: 'PLAYER',
    playerNumber: '10',
    numberColor: '',
    numberFont: 'college',
    locations: [],
    style: 0,
  };
}

/** Guests' saved designs, by item, in this browser (no account). */
type GuestDesign = { design: StudioDesign; qty: string; addons: string[]; at: string };
const GUEST_DESIGNS = 'clp-studio-designs-guest';
const guestDesigns = (): Record<string, GuestDesign> => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_DESIGNS) || '{}') as Record<string, GuestDesign>;
  } catch {
    return {};
  }
};
/** Saves a guest's design of an item; false when the browser can't (private mode, or full). */
const keepGuestDesign = (itemId: string, kept: GuestDesign) => {
  try {
    localStorage.setItem(GUEST_DESIGNS, JSON.stringify({ ...guestDesigns(), [itemId]: kept }));
    return true;
  } catch {
    return false;
  }
};

/** A data URL as a Blob (a cleaned-up logo, uploaded when the design is saved or sent). */
const dataBlob = async (url: string) => (await fetch(url)).blob();

/**
 * The design studio (/shop/?view=studio&item=<id>[&design=<id>], the Shop design): a CLP partner designs a bulk item
 * in their brand (templates, colours, patterns, their logo with clean-up and print locations, text, names and numbers),
 * sees it from every side, then saves it, asks for a bulk quote or orders it. Brand guidelines (the partner's kit,
 * locked) limit every choice to what's approved. Guests design here too and ask for a bulk quote with their details
 * (saving, ordering and partner pricing need a partner sign-in).
 */
export default function ShopStudio() {
  const params = useSearchParams();
  const router = useRouter();
  const brand = useStudio();
  const item = bulkItem(params.get('item') ?? '') ?? BULK_ITEMS[0];
  const designId = params.get('design') ?? '';

  if (brand.loading)
    return (
      <div className={`${st.studio} ${st.loading}`} aria-busy role="status">
        <span className={st.spinner} aria-hidden />
        Opening the design studio…
      </div>
    );
  return <Studio key={`${item.id}|${designId}`} item={item} designId={designId} brand={brand} go={(href) => router.push(href)} />;
}

function Studio({ item, designId, brand, go }: { item: BulkItem; designId: string; brand: StudioBrand; go: (href: string) => void }) {
  // A guest (not a signed-in partner): a bulk quote with their details, no saving, ordering or partner pricing.
  const guest = !brand.partner;
  const [contact, setContact] = useState({ name: '', organization: '', email: '', inHands: '', message: '', logoLink: '', deliverTo: '' });
  const kit = brand.kit;
  const locked = kit.locked;
  const shape = item.shape;
  const app = isApparel(shape);
  // A guest's design saved in this browser comes back where they left it.
  const [kept] = useState(() => (guest && !designId ? guestDesigns()[item.id] : undefined));
  const [d, setD] = useState<StudioDesign>(() => kept?.design ?? freshDesign(item, brand));
  const [savedId, setSavedId] = useState(designId);
  const [tab, setTab] = useState<Tab>('prod');
  const [view, setView] = useState('front');
  const [qty, setQty] = useState(kept?.qty ?? String(item.styles[0]?.min ?? item.min));
  const [addons, setAddons] = useState<string[]>(kept?.addons ?? []);
  const [colorTarget, setColorTarget] = useState<'main' | 'acc'>('main');
  const [custom, setCustom] = useState<[string, string][]>([]);
  const [pms, setPms] = useState('');
  const [tplAll, setTplAll] = useState(false);
  const [art, setArt] = useState<Art>(null);
  const [orig, setOrig] = useState('');
  const [clean, setClean] = useState({ remove: false, tolerance: 60, color: '' });
  const [cleaning, setCleaning] = useState(false);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState<'' | BulkKind | 'logo'>('');
  const [saved, setSaved] = useState(false);
  const [done, setDone] = useState<'' | 'quote' | 'order'>('');
  const [error, setError] = useState('');
  const preview = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<StudioDesign>) => {
    setSaved(false);
    setD((x) => ({ ...x, ...patch }));
  };

  // A saved design opens as it was.
  useEffect(() => {
    if (!designId) return;
    let live = true;
    myDesigns().then(
      (list) => {
        const found = list.find((r) => r.id === designId);
        if (!live || !found?.design) return;
        setD({ ...freshDesign(item, brand), ...found.design });
        const total = found.styles.reduce((n, x) => n + x.qty, 0) || found.qty;
        setQty(String(total));
        setAddons(found.addons ?? []);
        setSaved(true);
      },
      () => {},
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, for the design in the address.
  }, [designId]);

  // The views this item has; a side that doesn't exist goes back to the front.
  const views = VIEWS[shape] ?? [['front', 'Front']];
  const locs = LOCATIONS[shape] ?? [];
  const adds = ADDONS[shape] ?? [];
  const style = item.styles[d.style] ?? null;
  const min = style?.min ?? item.min;
  const printedOn = (v: string) => v === 'front' || (v === 'back' && app) || d.locations.includes(v);
  const viewLabel = views.find(([v]) => v === view)?.[1] ?? 'Front';

  // Brand guidelines: only the kit's options.
  const allowedColors = locked && kit.colors.length ? kit.colors : null;
  const fonts = FONTS.filter((f) => !locked || !kit.fonts.length || kit.fonts.includes(f.id));
  const patterns = PATTERNS.filter((p) => !locked || !kit.patterns.length || kit.patterns.includes(p.id));
  const places = PLACES.filter((p) => !locked || !kit.places.length || kit.places.includes(p.id));
  const templates = useMemo(() => {
    if (locked) {
      const colors = kit.colors.length ? kit.colors : [d.base];
      const pairs = colors.flatMap((a, i) => colors.filter((_, j) => j !== i).map((c) => [a, c] as [string, string])).slice(0, 4);
      const pats = (kit.patterns.length ? kit.patterns : ['none']).slice(0, 2);
      return pairs.flatMap(([base, accent]) => pats.map((pattern) => ({ label: `${colorName(base)}${pattern === 'none' ? '' : ` ${PATTERNS.find((p) => p.id === pattern)?.label.toLowerCase()}`}`, base, accent, pattern }))).slice(0, 8);
    }
    return TEMPLATES.filter((t) => tplAll || t.shapes === 'all' || t.shapes.includes(shape));
  }, [locked, kit.colors, kit.patterns, d.base, tplAll, shape]);
  const textColors = allowedColors ?? PALETTE;

  // The artwork's print check: vector files print at any size; a raster needs 300 DPI at its print width.
  const artCheck = (() => {
    if (!art) return null;
    if (art.kind === 'bad') return { label: 'Not accepted', bg: '#FCEBEB', fg: '#9B1C1C', msg: 'Use AI, EPS, PDF, SVG, PNG or JPG.' };
    if (art.kind === 'vector')
      return {
        label: 'Vector ✓',
        bg: '#E6F2E9',
        fg: '#1E5B33',
        msg: art.master ? 'Print-ready at any size. The preview uses your last image. Our prepress team asks you for this file with your proof.' : 'Print-ready at any size.',
      };
    const inch = printInches(shape, d.place) * d.logoScale;
    const dpi = Math.round((art.w ?? 0) / inch);
    const size = `${art.w}×${art.h} px at about ${Math.round(inch)} in wide.`;
    if (dpi >= 300) return { label: `${dpi} DPI ✓`, bg: '#E6F2E9', fg: '#1E5B33', msg: `${size} Sharp at this size.` };
    if (dpi >= 150) return { label: `${dpi} DPI`, bg: '#FFF4D6', fg: '#8A5A00', msg: `${size} Usable, but vector or 300 DPI looks sharper.` };
    return { label: `${dpi} DPI`, bg: '#FCEBEB', fg: '#9B1C1C', msg: `${art.w}×${art.h} px is too small for about ${Math.round(inch)} in. Upload vector (AI, EPS, PDF, SVG) or a larger PNG.` };
  })();

  const onArt = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (['ai', 'eps', 'pdf'].includes(ext)) return setArt({ name: file.name, kind: 'vector', master: true });
    if (!['svg', 'png', 'jpg', 'jpeg', 'webp'].includes(ext)) return setArt({ name: file.name, kind: 'bad' });
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setOrig(url);
      setClean({ remove: false, tolerance: 60, color: '' });
      if (ext === 'svg') {
        setArt({ name: file.name, kind: 'vector' });
        set({ logo: url, logoOn: true });
        return;
      }
      const im = new Image();
      im.onload = () => {
        setArt({ name: file.name, kind: 'raster', w: im.naturalWidth, h: im.naturalHeight });
        set({ logo: url, logoOn: true });
      };
      im.src = url;
    };
    reader.readAsDataURL(file);
  };

  // The design's sample: the CLP logo (its full address, so CLP's admin opens it too), print-ready as CLP's vector master.
  const pickSample = () => {
    const url = new URL(SAMPLE_LOGO, window.location.href).href;
    setArt({ name: 'clp-logo.svg', kind: 'vector' });
    setOrig(url);
    setClean({ remove: false, tolerance: 60, color: '' });
    set({ logo: url, logoOn: true });
  };

  // Logo clean-up: the background (the corner's colour) taken out, and the logo recoloured, on a canvas.
  const cleanUp = (next: typeof clean) => {
    setClean(next);
    if (!orig) return;
    if (!next.remove && !next.color) return set({ logo: orig });
    setCleaning(true);
    const im = new Image();
    im.onload = () => {
      try {
        const scale = Math.min(1, 900 / Math.max(im.naturalWidth || 900, im.naturalHeight || 900));
        const w = Math.max(1, Math.round((im.naturalWidth || 900) * scale));
        const h = Math.max(1, Math.round((im.naturalHeight || 450) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(im, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const px = data.data;
        const bg = [px[0], px[1], px[2]];
        const hex = next.color ? [1, 3, 5].map((i) => parseInt(next.color.slice(i, i + 2), 16)) : null;
        for (let i = 0; i < px.length; i += 4) {
          if (next.remove && Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) < next.tolerance) px[i + 3] = 0;
          if (hex && px[i + 3] > 0) [px[i], px[i + 1], px[i + 2]] = hex;
        }
        ctx.putImageData(data, 0, 0);
        set({ logo: canvas.toDataURL('image/png') });
      } finally {
        setCleaning(false);
      }
    };
    im.onerror = () => setCleaning(false);
    im.src = orig;
  };

  const addPms = () => {
    const code = pms.replace(/[^0-9]/g, '');
    if (!code) return;
    const c = PMS[code] ?? '#7F7F7F';
    setCustom([...custom, [c, `PMS ${code} C`]]);
    setPms('');
    set(colorTarget === 'acc' ? { accent: c } : { base: c });
  };

  const svg = () => preview.current?.querySelector('svg') as SVGSVGElement | null;

  /** The design with its logo uploaded (a cleaned-up or new file is sent to CLP's media first). */
  const persisted = async (): Promise<StudioDesign> => {
    if (!d.logo || /^https:\/\//.test(d.logo)) return d;
    // A guest's logo is kept with their cart (as their quote's); a partner's goes to CLP's media.
    const url = guest ? await uploadGuestImage(await imageDataUrl(d.logo)) : await uploadImage(await dataBlob(d.logo));
    setD((x) => ({ ...x, logo: url }));
    return { ...d, logo: url };
  };

  const send = async (kind: BulkKind) => {
    setError('');
    // A guest's design is saved in this browser (no account): its logo too, as it is.
    if (guest && kind === 'saved') {
      if (!keepGuestDesign(item.id, { design: d, qty, addons, at: new Date().toISOString() })) return setError('Your browser couldn’t save it. Remove the logo or free some space and try again.');
      return setSaved(true);
    }
    if (guest && (!contact.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim()))) return setError('Enter your name and a valid email for the quote.');
    setBusy(kind);
    try {
      const design = await persisted();
      let mockup = '';
      if (kind !== 'saved' && svg()) {
        try {
          mockup = guest ? await uploadGuestImage(await imageDataUrl(await mockupPng(svg()!, 800), 800)) : await uploadImage(await mockupPng(svg()!));
        } catch {
          // The request goes without its picture.
        }
      }
      const total = Math.max(Number(qty) || 0, 1);
      const input = {
        itemId: item.id,
        kind,
        styles: style ? [{ name: style.name, qty: total }] : [],
        qty: total,
        mode: 'logo' as const,
        priorities: [],
        addons,
        design,
        mockup,
      };
      if (guest) await sendGuestQuote({ ...input, kind: 'quote', contact: { ...contact, name: contact.name.trim(), email: contact.email.trim(), deliverTo: contact.deliverTo.trim() } });
      else if (kind === 'saved' && savedId) await updateDesign(savedId, input);
      else {
        const r = await createDesign(input);
        if (kind === 'saved') setSavedId(r.id);
      }
      if (kind === 'saved') setSaved(true);
      else setDone(kind);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send it. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const switchItem = (next: BulkItem) => {
    setPicker(false);
    go(shopHref({ view: 'studio', item: next.id }));
  };
  const index = BULK_ITEMS.findIndex((x) => x.id === item.id);
  const step = (n: number) => switchItem(BULK_ITEMS[(index + n + BULK_ITEMS.length) % BULK_ITEMS.length]);

  const tabs: [Tab, string, string][] = [
    ['prod', '▣', 'Product'],
    ['tpl', '▦', 'Templates'],
    ['color', '●', 'Colors'],
    ['pat', '▤', 'Pattern'],
    ['logo', '◎', 'Logo'],
    ['text', 'T', 'Text'],
    ...(app ? ([['back', '#', 'Name & No.']] as [Tab, string, string][]) : []),
  ];
  const pickTab = (t: Tab) => {
    setTab(t);
    if (t === 'back') setView('back');
    else if (t === 'logo' || t === 'text') setView('front');
  };
  const approved = locked && (
    <span className={st.approved}>
      <LockIcon size={14} stroke="currentColor" />
      Approved options only
    </span>
  );
  const sel = (on: boolean) => `${st.chip} ${on ? st.chipOn : ''}`;
  const swatchRow = (colors: string[], value: string, onPick: (c: string) => void, size = 32) => (
    <div className={st.swatches}>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={colorName(c)}
          title={colorName(c)}
          aria-pressed={value === c}
          className={st.swatch}
          style={{ width: size, height: size, background: c, boxShadow: value === c ? '0 0 0 2px #111111' : undefined }}
          onClick={() => onPick(c)}
        />
      ))}
    </div>
  );
  const libNote = <span className={st.libNote}>CLP adds new templates, colors, patterns and fonts in the admin library and matches them to each product.</span>;

  const colorGroups: [string, string[]][] = (() => {
    if (allowedColors) {
      const garment = item.colors && colorTarget === 'main' ? allowedColors.filter((c) => item.colors!.includes(c)) : allowedColors;
      return [[`Approved colors · ${brand.name}`, garment.length ? garment : allowedColors]];
    }
    if (item.colors && colorTarget === 'main') return [['Available garment colors', item.colors]];
    const team = [...new Set([...kit.colors, brand.color, '#DCBD7D', ...custom.map((x) => x[0])])];
    return [
      ['Team colors', team],
      ['Standard', PALETTE],
      ['Specialty · neon & metallic', SPECIALTY.map((x) => x[0])],
    ];
  })();

  const mockProps = {
    shape,
    base: d.base,
    accent: d.accent,
    pattern: d.pattern,
    trim: d.trim,
    logo: d.logo || undefined,
    logoOn: d.logoOn,
    placeholder: true,
    place: d.place,
    logoScale: d.logoScale,
    dx: d.dx,
    dy: d.dy,
    text: d.text,
    font: d.font,
    textColor: d.textColor,
    textPlace: d.textPlace,
    textScale: d.textScale,
    back: { name: d.playerName, number: d.playerNumber, color: d.numberColor, font: d.numberFont },
    locations: d.locations,
  };

  return (
    <div className={`${st.studio} ${studioFontVariables}`}>
      <div className={st.bar}>
        <div className={st.barInner}>
          <Link href={shopHref({ view: 'bulk' })} className={st.back}>
            ‹ Bulk &amp; Operations
          </Link>
          <span className={st.itemNav}>
            <button type="button" className={st.round} aria-label="Previous product" onClick={() => step(-1)}>
              ‹
            </button>
            <button type="button" className={st.itemBtn} onClick={() => setPicker(true)}>
              {item.name}
              <span>Change</span>
              <Chevron color="#666666" />
            </button>
            <button type="button" className={st.round} aria-label="Next product" onClick={() => step(1)}>
              ›
            </button>
          </span>
          <span className={st.barEnd}>
            {!guest && (
              <span className={st.forWho}>
                For <strong>{brand.name || 'your team'}</strong>
              </span>
            )}
            <button type="button" className={st.startOver} onClick={() => set(freshDesign(item, brand))}>
              Start over
            </button>
            <button type="button" className={st.save} onClick={() => send('saved')} disabled={Boolean(busy)} title={guest ? 'Saved in this browser' : undefined}>
              {busy === 'saved' ? 'Saving…' : saved ? 'Saved ✓' : 'Save design'}
            </button>
          </span>
        </div>
      </div>
      {locked && (
        <div className={st.guide}>
          <div className={st.guideInner}>
            <span className={st.guideTag}>
              <LockIcon size={14} stroke="currentColor" />
              BRAND GUIDELINES ON
            </span>
            <span>
              <strong>{brand.name}</strong> · Only approved colors, templates, patterns, logos, fonts and text can be used.{kit.manager ? ` Set by ${kit.manager}.` : ''}
            </span>
            <a href={`mailto:support@competelikepros.com?subject=${encodeURIComponent(`Brand exception: ${brand.name}`)}`}>Request an exception</a>
          </div>
        </div>
      )}

      <div className={st.layout}>
        <nav className={st.rail} aria-label="Studio tools">
          {tabs.map(([id, icon, label]) => (
            <button key={id} type="button" aria-pressed={tab === id} className={`${st.railBtn} ${tab === id ? st.railOn : ''}`} onClick={() => pickTab(id)}>
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className={st.panel}>
          {tab === 'prod' && (
            <div className={st.stack}>
              <span className={st.kicker}>THIS PRODUCT</span>
              <div className={st.prodMock}>
                <Mockup shape={shape} base={d.base} logo={d.logo || undefined} placeholder place={app ? 'front' : 'center'} />
              </div>
              <div className={st.prodText}>
                <span className={st.kicker}>{categoryOf(item.category)?.label.toUpperCase()}</span>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
                {item.stock && (
                  <span className={st.inStock}>
                    <span />
                    In stock · ready to decorate
                  </span>
                )}
              </div>
              <div className={st.specs}>
                {[
                  ['Material', item.material],
                  ['Decoration', item.decoration.join(', ')],
                  ['Sizes', item.sizes],
                  ['Minimum', `${item.min} ${item.unit}`],
                  ['Lead time', item.lead],
                  ['Print areas', ['Front', ...locs.map(([, l]) => l.replace(/ logo| text| engraving/g, ''))].join(', ')],
                  ['Views', views.map(([, l]) => l).join(', ')],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              <button type="button" className={st.outlineBtn} onClick={() => setPicker(true)}>
                Change product
              </button>
            </div>
          )}

          {tab === 'tpl' && (
            <div className={st.stack}>
              <span className={st.kicker}>TEMPLATES</span>
              {approved}
              {!locked && (
                <span className={st.tplHead}>
                  <span>{tplAll ? `Full library · ${TEMPLATES.length} templates` : `${templates.length} templates for ${categoryOf(item.category)?.label.toLowerCase()}`}</span>
                  <button type="button" onClick={() => setTplAll(!tplAll)}>
                    {tplAll ? 'Show matches' : 'Full library'}
                  </button>
                </span>
              )}
              <div className={st.tiles}>
                {templates.map((t) => {
                  const on = d.base === t.base && d.accent === t.accent && d.pattern === t.pattern;
                  return (
                    <button key={`${t.label}-${t.base}-${t.pattern}`} type="button" className={`${st.tileBtn} ${on ? st.tileOn : ''}`} onClick={() => set({ base: t.base, accent: t.accent, pattern: t.pattern })}>
                      <span className={st.tilePreview} style={{ background: patternCss(t.pattern, t.base, t.accent) }} />
                      <strong>{t.label}</strong>
                    </button>
                  );
                })}
              </div>
              {libNote}
            </div>
          )}

          {tab === 'color' && (
            <div className={st.stack}>
              <span className={st.kicker}>COLORS</span>
              {approved}
              <div className={st.chips}>
                <button type="button" className={sel(colorTarget === 'main')} onClick={() => setColorTarget('main')}>
                  Main color
                </button>
                <button type="button" className={sel(colorTarget === 'acc')} onClick={() => setColorTarget('acc')}>
                  Accent &amp; trim
                </button>
              </div>
              {colorGroups.map(([label, colors]) => (
                <div key={label} className={st.group}>
                  <strong>{label}</strong>
                  {swatchRow(colors, colorTarget === 'acc' ? d.accent : d.base, (c) => set(colorTarget === 'acc' ? { accent: c } : { base: c }))}
                </div>
              ))}
              {!locked && (
                <div className={st.group}>
                  <strong>Match a Pantone (PMS)</strong>
                  <div className={st.inline}>
                    <input className={st.input} value={pms} onChange={(e) => setPms(e.target.value)} placeholder="e.g. 186 C" />
                    <button type="button" className={st.smallBtn} onClick={addPms}>
                      Add
                    </button>
                  </div>
                  <span className={st.note}>Added colors save to your team colors. Prepress matches exact PMS values.</span>
                </div>
              )}
              <label className={st.check}>
                <input type="checkbox" checked={d.trim} onChange={() => set({ trim: !d.trim })} /> Show accent trim (collar, cuffs, bands)
              </label>
              <span className={st.deco}>{decorationRule(item)}</span>
            </div>
          )}

          {tab === 'pat' && (
            <div className={st.stack}>
              <span className={st.kicker}>PATTERN</span>
              {approved}
              <div className={st.tiles}>
                {patterns.map((p) => (
                  <button key={p.id} type="button" className={`${st.tileBtn} ${d.pattern === p.id ? st.tileOn : ''}`} onClick={() => set({ pattern: p.id })}>
                    <span className={st.tilePreview} style={{ height: 56, background: patternCss(p.id, d.base, d.accent) }} />
                    <strong>{p.label}</strong>
                  </button>
                ))}
              </div>
              <span className={st.note}>Patterns use your accent color. Our designers fine-tune every pattern for production.</span>
              {libNote}
            </div>
          )}

          {tab === 'logo' && (
            <div className={st.stack}>
              <span className={st.kicker}>LOGO</span>
              {approved}
              {locked ? (
                <div className={st.group}>
                  <strong>Approved logos</strong>
                  <div className={st.tiles}>
                    {(kit.logos.length ? kit.logos : brand.logo ? [{ label: 'Brand logo', src: brand.logo }] : []).map((l) => (
                      <button key={l.src} type="button" className={`${st.tileBtn} ${d.logo === l.src ? st.tileOn : ''}`} onClick={() => set({ logo: l.src, logoOn: true })}>
                        <span className={st.logoTile} style={{ background: d.base }}>
                          <img src={l.src} alt="" />
                        </span>
                        <strong>{l.label}</strong>
                      </button>
                    ))}
                  </div>
                  <span className={st.note}>Uploads are off for this brand. Vector masters are on file with prepress.</span>
                </div>
              ) : (
                <>
                  <div className={st.upload}>
                    <span className={st.uploadBox} style={{ background: d.logo ? d.base : '#FBFAF7' }}>
                      {d.logo && <img src={d.logo} alt="" />}
                    </span>
                    <span className={st.uploadBtns}>
                      <button type="button" className={st.darkBtn} onClick={() => fileRef.current?.click()}>
                        Upload artwork
                      </button>
                      <input ref={fileRef} type="file" accept=".ai,.eps,.pdf,.svg,.png,.jpg,.jpeg,.webp" hidden onChange={onArt} />
                      {brand.logo && brand.logo !== d.logo && (
                        <button type="button" className={st.linkBtn} onClick={() => set({ logo: brand.logo, logoOn: true })}>
                          Use my brand logo
                        </button>
                      )}
                      <button type="button" className={st.linkBtn} onClick={pickSample}>
                        Use sample logo
                      </button>
                    </span>
                  </div>
                  <span className={st.note}>Best: vector AI, EPS, PDF or SVG. Also accepted: PNG or JPG at 300 DPI at print size.</span>
                  {art && artCheck && (
                    <div className={st.artCheck} style={{ background: artCheck.bg }}>
                      <span>
                        <strong>{art.name}</strong>
                        <strong style={{ color: artCheck.fg }}>{artCheck.label}</strong>
                      </span>
                      <span>{artCheck.msg}</span>
                    </div>
                  )}
                  {orig && art?.kind !== 'bad' && (
                    <div className={st.cleanup}>
                      <span className={st.cleanHead}>
                        <strong>Clean up logo</strong>
                        <button type="button" onClick={() => cleanUp({ remove: false, tolerance: 60, color: '' })}>
                          Reset
                        </button>
                      </span>
                      <div className={st.checker}>{d.logo && <img src={d.logo} alt="Logo preview" />}</div>
                      <label className={st.check}>
                        <input type="checkbox" checked={clean.remove} onChange={() => cleanUp({ ...clean, remove: !clean.remove })} /> Remove background
                      </label>
                      {clean.remove && (
                        <label className={st.range}>
                          Strength
                          <input type="range" min={10} max={140} step={5} value={clean.tolerance} onChange={(e) => cleanUp({ ...clean, tolerance: Number(e.target.value) })} />
                        </label>
                      )}
                      <strong className={st.small}>Logo color</strong>
                      <div className={st.swatches}>
                        <button type="button" className={sel(!clean.color)} onClick={() => cleanUp({ ...clean, color: '' })}>
                          Original
                        </button>
                        {[...new Set([...kit.colors, '#111111', '#FFFFFF', '#DCBD7D', '#0B2A5B', '#7A1F2B', '#C8102E'])].map((c) => (
                          <button key={c} type="button" aria-label={`Logo color ${colorName(c)}`} className={st.swatch} style={{ width: 28, height: 28, background: c, boxShadow: clean.color === c ? '0 0 0 2px #111111' : undefined }} onClick={() => cleanUp({ ...clean, color: c })} />
                        ))}
                      </div>
                      <span className={st.note}>One-color logos work best for embroidery and knit. Prepress still checks every file.</span>
                      {cleaning && <span className={st.updating}>Updating…</span>}
                    </div>
                  )}
                </>
              )}
              <label className={st.check}>
                <input type="checkbox" checked={d.logoOn} onChange={() => set({ logoOn: !d.logoOn })} /> Show logo
              </label>
              <div className={st.group}>
                <strong>Print locations</strong>
                <span className={st.always}>
                  <span>✓</span>
                  {shape === 'sock' ? 'Outer side (main)' : shape === 'tent' ? 'Front canopy (main)' : 'Front (main)'} · always on
                </span>
                {locs.map(([id, label]) => (
                  <label key={id} className={st.check}>
                    <input
                      type="checkbox"
                      checked={d.locations.includes(id)}
                      onChange={() => {
                        const on = d.locations.includes(id);
                        set({ locations: on ? d.locations.filter((x) => x !== id) : [...d.locations, id] });
                        if (!on) setView(id);
                      }}
                    />{' '}
                    {label}
                  </label>
                ))}
                <span className={st.note}>Each extra location may add to the price. Only locations this product allows are listed.</span>
              </div>
              <div className={st.group}>
                <strong>Front placement</strong>
                <div className={st.chips}>
                  {places.map((p) => (
                    <button key={p.id} type="button" className={sel(d.place === p.id)} onClick={() => set({ place: p.id, dx: 0, dy: 0 })}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={st.group}>
                <strong>Size</strong>
                <input className={st.slider} type="range" min={locked ? 0.8 : 0.5} max={1.8} step={0.1} value={d.logoScale} aria-label="Logo size" onChange={(e) => set({ logoScale: Number(e.target.value) })} />
              </div>
              <div className={st.group}>
                <strong>Nudge</strong>
                <div className={st.nudge}>
                  {(
                    [
                      ['←', -4, 0, 'Move left'],
                      ['↑', 0, -4, 'Move up'],
                      ['↓', 0, 4, 'Move down'],
                      ['→', 4, 0, 'Move right'],
                      ['⟲', 0, 0, 'Reset position'],
                    ] as const
                  ).map(([l, x, y, aria]) => (
                    <button key={aria} type="button" aria-label={aria} onClick={() => set(l === '⟲' ? { dx: 0, dy: 0 } : { dx: d.dx + x, dy: d.dy + y })}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'text' && (
            <div className={st.stack}>
              <span className={st.kicker}>TEXT</span>
              {approved}
              {locked && kit.phrases.length ? (
                <span className={st.selectWrap}>
                  <select className={st.input} value={d.text} onChange={(e) => set({ text: e.target.value })} aria-label="Approved text">
                    <option value="">No text</option>
                    {kit.phrases.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <Chevron color="#666666" className={st.selectChevron} />
                </span>
              ) : (
                <input className={st.input} value={d.text} maxLength={20} onChange={(e) => set({ text: e.target.value })} placeholder="Team name, event or slogan" />
              )}
              <div className={st.group}>
                <strong>Font</strong>
                <div className={st.fonts}>
                  {fonts.map((f) => {
                    const fs = FONT_STYLE[f.id];
                    return (
                      <button key={f.id} type="button" className={`${st.fontBtn} ${d.font === f.id ? st.tileOn : ''}`} onClick={() => set({ font: f.id })}>
                        <span style={{ fontFamily: fs.family, fontWeight: fs.weight }}>{f.label}</span>
                        <span>{f.kind}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={st.group}>
                <strong>Color</strong>
                {swatchRow(textColors, d.textColor || (isLight(d.base) ? '#111111' : '#FFFFFF'), (c) => set({ textColor: c }))}
              </div>
              <div className={st.group}>
                <strong>Placement</strong>
                <div className={st.chips}>
                  {[
                    ['above', 'Above logo'],
                    ['below', 'Below logo'],
                    ['hem', 'Bottom'],
                  ].map(([v, l]) => (
                    <button key={v} type="button" className={sel(d.textPlace === v)} onClick={() => set({ textPlace: v })}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className={st.group}>
                <strong>Size</strong>
                <input className={st.slider} type="range" min={0.6} max={1.8} step={0.1} value={d.textScale} aria-label="Text size" onChange={(e) => set({ textScale: Number(e.target.value) })} />
              </div>
              {libNote}
            </div>
          )}

          {tab === 'back' && (
            <div className={st.stack}>
              <span className={st.kicker}>NAME &amp; NUMBER</span>
              <span className={st.muted}>Shown on the back. Each player’s name and number go in the size list on your order.</span>
              <label className={st.field}>
                Sample name
                <input className={st.input} value={d.playerName} maxLength={14} onChange={(e) => set({ playerName: e.target.value.toUpperCase() })} />
              </label>
              <label className={st.field}>
                Sample number
                <input className={st.input} value={d.playerNumber} maxLength={2} inputMode="numeric" onChange={(e) => set({ playerNumber: e.target.value.replace(/[^0-9]/g, '') })} />
              </label>
              <div className={st.group}>
                <strong>Color</strong>
                {swatchRow(textColors, d.numberColor || (isLight(d.base) ? '#111111' : '#FFFFFF'), (c) => set({ numberColor: c }))}
              </div>
              <div className={st.group}>
                <strong>Font</strong>
                <div className={st.chips}>
                  {[
                    ['college', 'College'],
                    ['mont', 'Block'],
                  ].map(([v, l]) => (
                    <button key={v} type="button" className={sel(d.numberFont === v)} onClick={() => set({ numberFont: v })}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={st.previewCol}>
          <div className={st.preview} ref={preview}>
            <Mockup {...mockProps} view={view} className={st.previewSvg} label={`${item.name}, ${viewLabel}`} />
            {!printedOn(view) && <span className={st.viewEmpty}>Nothing printed on this side · turn it on in Logo → Print locations</span>}
            <span className={st.viewTag}>{viewLabel} · Preview</span>
            {done && (
              <div className={st.done}>
                <span className={st.doneMark}>✓</span>
                <strong>{done === 'order' ? 'Order placed' : 'Bulk quote requested'}</strong>
                <span>{done === 'order' ? 'Order received. We’ll send a production proof to approve, then it’s made and shipped in bulk.' : 'Our team will send your bulk quote within 2 business days.'}</span>
                <div className={st.doneBtns}>
                  <button type="button" className={st.outlineBtn} onClick={() => setDone('')}>
                    Keep designing
                  </button>
                  <Link className={st.darkBtn} href={shopHref({ view: 'bulk' })}>
                    Back to Bulk
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className={st.views}>
            {views.map(([v, l]) => (
              <button key={v} type="button" aria-pressed={view === v} className={`${st.viewBtn} ${view === v ? st.viewOn : ''}`} onClick={() => setView(v)}>
                {l}
                <span style={{ background: printedOn(v) ? '#2E9E5B' : '#D9D7D2' }} />
              </button>
            ))}
          </div>
          <span className={st.decoPill}>{decorationRule(item)}</span>
          <span className={st.previewNote}>Preview only. We send a production proof with exact colors and sizing before anything is made.</span>
          <button
            type="button"
            className={st.download}
            onClick={async () => {
              const el = svg();
              if (el) saveFile(await mockupPng(el), `${item.id}-${view}.png`);
            }}
          >
            Download mockup
          </button>
        </div>

        <aside className={st.aside}>
          <div className={st.group}>
            <span className={st.kicker}>STYLE</span>
            <span className={st.selectWrap}>
              <select className={st.input} value={d.style} onChange={(e) => set({ style: Number(e.target.value) })} aria-label="Style">
                {(item.styles.length ? item.styles : [{ name: 'Standard', note: '', min: item.min }]).map((v, i) => (
                  <option key={v.name} value={i}>
                    {v.name}
                  </option>
                ))}
              </select>
              <Chevron color="#666666" className={st.selectChevron} />
            </span>
          </div>
          {item.stock && (
            <span className={st.inStock}>
              <span />
              In stock · ready to decorate
            </span>
          )}
          <label className={st.field}>
            Quantity
            <input className={st.input} type="number" min={min} value={qty} onChange={(e) => setQty(e.target.value)} />
            {Number(qty) < min && <span className={st.warn}>Minimum {min}</span>}
          </label>
          <div className={st.group}>
            <span className={st.kicker}>ADD-ONS</span>
            {adds.length === 0 && <span className={st.muted}>No add-ons for this product.</span>}
            {adds.map(([id, label, unit]) => {
              const on = addons.includes(label);
              return (
                <label key={id} className={`${st.addon} ${on ? st.addonOn : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => setAddons(on ? addons.filter((x) => x !== label) : [...addons, label])} />
                  <span>{label}</span>
                  <span className={st.addonPrice}>Quoted{unit}</span>
                </label>
              );
            })}
          </div>
          <div className={st.priceBox}>
            <span className={st.priceRow}>
              <span>Price per unit</span>
              <strong>On your quote</strong>
            </span>
            {addons.length > 0 && (
              <span className={st.priceRow}>
                <span>Add-ons ({addons.length})</span>
                <strong>On your quote</strong>
              </span>
            )}
            <span className={`${st.priceRow} ${st.priceTotal}`}>
              <span>Est. total · {Math.max(Number(qty) || 0, 0)} pcs</span>
              <strong>{guest ? 'On your quote' : 'Partner pricing'}</strong>
            </span>
            {guest && (
              <div className={st.guestFields}>
                <span className={st.kicker}>YOUR DETAILS</span>
                <input className={st.input} aria-label="Name" placeholder="Name" maxLength={120} autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
                <input className={st.input} aria-label="Email" type="email" placeholder="Email" maxLength={200} autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                <input className={st.input} aria-label="Organization" placeholder="Team, school or company" maxLength={120} autoComplete="organization" value={contact.organization} onChange={(e) => setContact({ ...contact, organization: e.target.value })} />
                <input className={st.input} aria-label="Deliver to" placeholder="Deliver to (city)" maxLength={160} value={contact.deliverTo} onChange={(e) => setContact({ ...contact, deliverTo: e.target.value })} />
                <label className={st.field}>
                  In-hands date
                  <input className={st.input} type="date" value={contact.inHands} onChange={(e) => setContact({ ...contact, inHands: e.target.value })} />
                </label>
                <textarea className={st.input} aria-label="Anything else" rows={2} maxLength={2000} placeholder="Anything else? Sizes, colors, deadline" value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} />
              </div>
            )}
            {error && <span className={st.error}>{error}</span>}
            {!guest && (
              <button type="button" className={st.buy} disabled={Boolean(busy) || Number(qty) < min} onClick={() => send('order')}>
                {busy === 'order' ? 'Placing…' : 'Buy Now'}
              </button>
            )}
            <button type="button" className={st.quote} disabled={Boolean(busy) || Number(qty) < min} onClick={() => send('quote')}>
              {busy === 'quote' ? 'Sending…' : 'Get a Bulk Quote'}
            </button>
          </div>
        </aside>
      </div>

      {picker && <Picker current={item} base={d.base} logo={d.logo} onPick={switchItem} onClose={() => setPicker(false)} />}
    </div>
  );
}

/** "Change product": every item by category, each starting a fresh design. */
function Picker({ current, base, logo, onPick, onClose }: { current: BulkItem; base: string; logo: string; onPick: (it: BulkItem) => void; onClose: () => void }) {
  useEffect(() => {
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return createPortal(
    <div className={st.pickerScrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={st.picker} role="dialog" aria-modal="true" aria-label="Change product">
        <div className={st.pickerHead}>
          <span>
            <strong>Change product</strong>
            <span>Each product starts a fresh design with its own options.</span>
          </span>
          <button type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className={st.pickerBody}>
          {BULK_CATEGORIES.map((c) => {
            const list = BULK_ITEMS.filter((x) => x.category === c.id);
            if (!list.length) return null;
            return (
              <div key={c.id} className={st.pickerGroup}>
                <strong>{c.label}</strong>
                <div className={st.pickerGrid}>
                  {list.map((x) => (
                    <button key={x.id} type="button" className={st.pickerItem} onClick={() => onPick(x)}>
                      <span className={`${st.pickerMock} ${x.id === current.id ? st.pickerOn : ''}`}>
                        <Mockup shape={x.shape} base={base} logo={logo || undefined} placeholder place="front" />
                      </span>
                      <strong>{x.name}</strong>
                      <span>{x.stock ? `In stock · min ${x.min}` : `Made to order · min ${x.min}`}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
