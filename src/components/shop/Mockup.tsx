'use client';

import { useId, type ReactNode } from 'react';
import { isApparel, type Shape } from '@/content/bulk';

export { mockupPng } from './mockupPng';

/**
 * A bulk item drawn as the design's mockups: its shape seen from one side, filled with the main colour, a pattern in
 * the accent colour clipped to the shape, accent trim (collar, cuffs, bands), then the logo, text and, on an apparel
 * back, the player's name and number. Everything is one SVG in a 200-unit space (the shape fills 84% of it, inset 8%
 * as the design's), so it scales to any size and downloads as an image (see mockupPng).
 */
export type MockupProps = {
  shape: Shape;
  view?: string;
  base: string;
  accent?: string;
  pattern?: string;
  trim?: boolean;
  /** The logo's image (or none); `placeholder` draws the design's dashed "LOGO" box when there's none. */
  logo?: string;
  logoOn?: boolean;
  placeholder?: boolean;
  /** Where the front logo sits: apparel chest | center | full (the studio), or front (the bulk tiles); others center. */
  place?: string;
  logoScale?: number;
  dx?: number;
  dy?: number;
  text?: string;
  font?: string;
  textColor?: string;
  textPlace?: string;
  textScale?: number;
  back?: { name: string; number: string; color: string; font: string };
  /** The extra print locations switched on (sleeves, inner side, back…). */
  locations?: string[];
  className?: string;
  label?: string;
};

/** The studio's fonts: family (next/font variables, see studioFonts), weight, case and letter spacing. */
export const FONT_STYLE: Record<string, { family: string; weight: number; upper: boolean; spacing: number }> = {
  mont: { family: 'var(--font-montserrat), Montserrat, sans-serif', weight: 800, upper: true, spacing: 1 },
  block: { family: 'var(--font-bebas), "Bebas Neue", Impact, sans-serif', weight: 400, upper: true, spacing: 1 },
  college: { family: 'var(--font-graduate), Graduate, Georgia, serif', weight: 400, upper: true, spacing: 0.5 },
  condensed: { family: 'var(--font-oswald), Oswald, "Arial Narrow", sans-serif', weight: 600, upper: true, spacing: 0.5 },
  serif: { family: 'var(--font-playfair), "Playfair Display", Georgia, serif', weight: 700, upper: false, spacing: 0 },
  script: { family: 'var(--font-yellowtail), Yellowtail, cursive', weight: 400, upper: false, spacing: 0 },
  brush: { family: 'var(--font-marker), "Permanent Marker", cursive', weight: 400, upper: false, spacing: 0 },
};

const LIGHT = ['#FFFFFF', '#DCBD7D', '#F2EAD8', '#E87722', '#E4FF1A', '#A8A9AD'];
export const isLight = (c: string) => LIGHT.includes(c.toUpperCase());

type Part = { d: string; fill?: 'base' | string; stroke?: string; width?: number; outline?: boolean };
type ViewShape = { body: string; under?: Part[]; over?: Part[]; trim?: Part[]; mirror?: boolean };

const TEE_FRONT = 'M70 20 L40 30 L15 65 L40 80 L50 70 L50 185 L150 185 L150 70 L160 80 L185 65 L160 30 L130 20 Q100 45 70 20 Z';
const TEE_BACK = 'M70 20 L40 30 L15 65 L40 80 L50 70 L50 185 L150 185 L150 70 L160 80 L185 65 L160 30 L130 20 Q100 30 70 20 Z';
const JACKET_FRONT = 'M70 20 L40 28 L22 60 L12 170 L36 172 L48 88 L50 185 L150 185 L152 88 L164 172 L188 170 L178 60 L160 28 L130 20 Q100 40 70 20 Z';
const JACKET_BACK = 'M70 20 L40 28 L22 60 L12 170 L36 172 L48 88 L50 185 L150 185 L152 88 L164 172 L188 170 L178 60 L160 28 L130 20 Q100 30 70 20 Z';
const SIDE = 'M75 22 Q100 16 125 22 L132 186 L68 186 Z';
const SOCK = 'M80 12 H132 V112 Q132 126 121 137 L86 176 Q70 192 54 179 Q41 165 55 149 L80 121 Z';
const CAP = 'M34 126 Q34 50 104 50 Q172 50 172 126 Z';
const CAP_SIDE = 'M30 128 Q34 58 108 54 Q166 56 170 128 Z';
const ROOF = 'M14 76 L100 28 L186 76 Z';
const FLAG = 'M59 14 Q132 10 142 62 Q134 120 124 162 L59 162 Z';
const ARCH = 'M18 186 V102 A82 82 0 0 1 182 102 V186 H144 V108 A44 44 0 0 0 56 108 V186 Z';
const RIBBON = 'M68 12 H96 L112 78 H84 Z M132 12 H104 L88 78 H116 Z';
const BOTTLE = 'M86 12 H114 V34 Q136 44 136 70 V180 Q136 190 126 190 H74 Q64 190 64 180 V70 Q64 44 86 34 Z';
const TOTE = 'M40 72 H160 L154 190 H46 Z';
const SPARK = 'M100 18 L118 78 L182 82 L132 120 L150 182 L100 146 L50 182 L68 120 L18 82 L82 78 Z';
const METAL = '#9A9890';

const teeSide = (sleeve: string, cuff: string): ViewShape => ({ body: SIDE, over: [{ d: sleeve, fill: 'base', outline: true }], trim: [{ d: cuff, width: 8 }] });

/** Every shape's views, from the design's studio. */
const SHAPES: Record<Shape, Record<string, ViewShape>> = {
  tee: {
    front: { body: TEE_FRONT, trim: [{ d: 'M72 21 Q100 44 128 21', width: 6 }, { d: 'M17 63 L40 78 M183 63 L160 78', width: 6 }] },
    back: { body: TEE_BACK, trim: [{ d: 'M72 21 Q100 32 128 21', width: 6 }, { d: 'M17 63 L40 78 M183 63 L160 78', width: 6 }] },
    left: teeSide('M88 32 L150 58 L138 92 L90 76 Z', 'M144 76 L139 91'),
    right: { ...teeSide('M88 32 L150 58 L138 92 L90 76 Z', 'M144 76 L139 91'), mirror: true },
  },
  jacket: {
    front: { body: JACKET_FRONT, under: [{ d: 'M100 32 V185', stroke: '#00000033', width: 2 }], trim: [{ d: 'M72 21 Q100 40 128 21', width: 6 }, { d: 'M13 166 L36 168 M187 166 L164 168', width: 6 }] },
    back: { body: JACKET_BACK },
    left: teeSide('M88 32 L162 148 L142 162 L90 82 Z', 'M158 151 L145 160'),
    right: { ...teeSide('M88 32 L162 148 L142 162 L90 82 Z', 'M158 151 L145 160'), mirror: true },
  },
  sock: {
    front: { body: SOCK, under: [{ d: 'M80 30 H132', stroke: '#00000022', width: 6 }], trim: [{ d: 'M80 22 H132', width: 10 }] },
    back: { body: SOCK, under: [{ d: 'M80 30 H132', stroke: '#00000022', width: 6 }], trim: [{ d: 'M80 22 H132', width: 10 }], mirror: true },
  },
  cap: {
    front: { body: CAP, under: [{ d: 'M96 120 H192 Q192 142 152 142 H96 Z', fill: 'base' }] },
    left: { body: CAP_SIDE, over: [{ d: 'M32 120 L6 126 Q4 138 32 138 Z', fill: 'base', outline: true }] },
    right: { body: CAP_SIDE, over: [{ d: 'M32 120 L6 126 Q4 138 32 138 Z', fill: 'base', outline: true }], mirror: true },
    back: { body: CAP, over: [{ d: 'M86 126 Q104 100 122 126 Z', fill: '#F4F3F0' }] },
  },
  tent: {
    front: { body: ROOF, under: [{ d: 'M25 96 H33 V186 H25 Z M167 96 H175 V186 H167 Z', fill: METAL }], over: [{ d: 'M14 76 H186 V98 H14 Z', fill: 'base', outline: true }] },
    side: { body: 'M25 58 H175 V172 H25 Z', under: [{ d: 'M25 172 H33 V186 H25 Z M167 172 H175 V186 H167 Z', fill: METAL }] },
    back: { body: ROOF, under: [{ d: 'M25 96 H33 V186 H25 Z M167 96 H175 V186 H167 Z', fill: METAL }], over: [{ d: 'M14 76 H186 V98 H14 Z', fill: 'base', outline: true }], mirror: true },
  },
  bib: { front: { body: 'M60 18 Q100 58 140 18 L166 40 V186 H34 V40 Z' }, back: { body: 'M66 18 Q100 34 134 18 L166 40 V186 H34 V40 Z' } },
  flag: { front: { body: FLAG, under: [{ d: 'M52 10 H59 V192 H52 Z', fill: METAL }] }, back: { body: FLAG, under: [{ d: 'M52 10 H59 V192 H52 Z', fill: METAL }], mirror: true } },
  arch: { front: { body: ARCH }, back: { body: ARCH } },
  medal: { front: { body: RIBBON }, back: { body: RIBBON } },
  bottle: { front: { body: BOTTLE, over: [{ d: 'M84 12 H116 V24 H84 Z', fill: '#555555' }] }, back: { body: BOTTLE, over: [{ d: 'M84 12 H116 V24 H84 Z', fill: '#555555' }] } },
  tote: { front: { body: TOTE, under: [{ d: 'M72 74 Q72 26 100 26 Q128 26 128 74', stroke: 'base', width: 7 }] }, back: { body: TOTE, under: [{ d: 'M72 74 Q72 26 100 26 Q128 26 128 74', stroke: 'base', width: 7 }] } },
  spark: { front: { body: SPARK } },
};

/** Where the front logo sits on each shape (x, y, width in the 200-unit space; a flag's leans). */
const LOGO_AT: Record<Exclude<Shape, 'tee' | 'jacket'>, [number, number, number, number?]> = {
  sock: [106, 64, 30],
  bib: [100, 92, 60],
  tent: [100, 62, 46],
  flag: [96, 84, 54, -6],
  arch: [100, 40, 56],
  medal: [100, 128, 54],
  bottle: [100, 122, 48],
  tote: [100, 132, 64],
  cap: [100, 92, 46],
  spark: [100, 104, 40],
};
const APPAREL_AT: Record<string, [number, number, number]> = { chest: [122, 62, 20], center: [100, 84, 46], full: [100, 102, 74], front: [100, 86, 52] };

/** The front logo's box (centre x, y and width) for a shape at a placement. */
export function logoBox(shape: Shape, place = 'center', scale = 1, dx = 0, dy = 0) {
  let at: [number, number, number, number?];
  if (isApparel(shape)) at = APPAREL_AT[place] ?? APPAREL_AT.center;
  else {
    const b = LOGO_AT[shape];
    at = place === 'chest' ? [b[0], b[1], b[2] * 0.6, b[3]] : place === 'full' ? [b[0], b[1], b[2] * 1.4, b[3]] : b;
  }
  return { x: at[0] + dx, y: at[1] + dy, w: at[2] * scale, rotate: at[3] ?? 0 };
}

const range = (n: number, start: number, step: number) => Array.from({ length: n }, (_, i) => start + i * step);

function Pattern({ id, pattern, accent }: { id: string; pattern: string; accent: string }) {
  switch (pattern) {
    case 'fade':
      return <rect x="0" y="0" width="200" height="200" fill={`url(#${id}-fade)`} />;
    case 'stripes':
      return (
        <>
          {range(13, 4, 16).map((x) => (
            <rect key={x} x={x} y="0" width="6" height="200" fill={accent} />
          ))}
        </>
      );
    case 'hoops':
      return (
        <>
          {range(6, 30, 30).map((y) => (
            <rect key={y} x="0" y={y} width="200" height="13" fill={accent} />
          ))}
        </>
      );
    case 'sash':
      return <polygon points="40,0 80,0 170,200 130,200" fill={accent} />;
    case 'chest':
      return <rect x="0" y="52" width="200" height="22" fill={accent} />;
    case 'pin':
      return (
        <>
          {range(17, 6, 12).map((x) => (
            <rect key={x} x={x} y="0" width="2" height="200" fill={accent} />
          ))}
        </>
      );
    case 'split':
      return <rect x="100" y="0" width="100" height="200" fill={accent} />;
    default:
      return null;
  }
}

function Logo({ x, y, w, rotate = 0, logo, color }: { x: number; y: number; w: number; rotate?: number; logo?: string; color: string }) {
  const transform = rotate ? `rotate(${rotate} ${x} ${y})` : undefined;
  if (logo) return <image href={logo} x={x - w / 2} y={y - w / 2} width={w} height={w} preserveAspectRatio="xMidYMid meet" transform={transform} />;
  return (
    <g transform={transform}>
      <rect x={x - w / 2} y={y - w / 4} width={w} height={w / 2} rx="2" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 2" />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(4, w / 7)} fontWeight="800" letterSpacing="0.5" fill={color} fontFamily="var(--font-open-sans), sans-serif">
        LOGO
      </text>
    </g>
  );
}

function Text({ x, y, text, font = 'mont', color, size }: { x: number; y: number; text: string; font?: string; color: string; size: number }) {
  const f = FONT_STYLE[font] ?? FONT_STYLE.mont;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill={color}
      fontSize={size}
      fontWeight={f.weight}
      letterSpacing={f.spacing}
      style={{ fontFamily: f.family, textTransform: f.upper ? 'uppercase' : 'none' }}
    >
      {f.upper ? text.toUpperCase() : text}
    </text>
  );
}

export default function Mockup(props: MockupProps) {
  const {
    shape,
    view = 'front',
    base,
    accent = '#DCBD7D',
    pattern = 'none',
    trim = false,
    logo,
    logoOn = true,
    placeholder = false,
    place = 'center',
    logoScale = 1,
    dx = 0,
    dy = 0,
    text = '',
    font = 'mont',
    textPlace = 'below',
    textScale = 1,
    back,
    locations = [],
    className,
    label,
  } = props;
  const id = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const views = SHAPES[shape] ?? SHAPES.tee;
  const v = views[view] ?? views.front;
  const ink = isLight(base) ? '#8A8A8A' : 'rgba(255,255,255,0.85)';
  const textColor = props.textColor || (isLight(base) ? '#111111' : '#FFFFFF');
  const fillOf = (f?: string) => (f === 'base' ? base : f);
  const app = isApparel(shape);

  // What prints on this side: the front logo and text; an apparel back's name and number; the extra locations.
  const marks: ReactNode[] = [];
  const showLogo = logoOn && (logo || placeholder);
  if (view === 'front') {
    const box = logoBox(shape, place, logoScale, dx, dy);
    if (showLogo) marks.push(<Logo key="logo" {...box} logo={logo} color={ink} />);
    if (text) {
      const ty = textPlace === 'above' ? box.y - box.w * 0.5 - 10 : textPlace === 'hem' ? (app ? 162 : 178) : box.y + box.w * 0.5 + 12;
      const tx = place === 'chest' && textPlace !== 'hem' ? box.x : 100;
      marks.push(<Text key="text" x={tx} y={ty} text={text} font={font} color={textColor} size={11 * textScale} />);
    }
  } else if (view === 'back' && app && back) {
    marks.push(<Text key="name" x={100} y={55} text={back.name} font={back.font === 'college' ? 'college' : 'mont'} color={back.color || textColor} size={13} />);
    marks.push(<Text key="num" x={100} y={106} text={back.number} font={back.font === 'college' ? 'college' : 'mont'} color={back.color || textColor} size={64} />);
  } else if (locations.includes(view)) {
    const small = (x: number, y: number, w: number) => <Logo key={`${x}-${y}`} x={x} y={y} w={w} logo={logo} color={ink} />;
    if (app) marks.push(small(view === 'left' ? 118 : 82, 63, 14));
    else if (shape === 'cap') marks.push(view === 'back' ? <Text key="t" x={100} y={104} text={text || 'TEAM'} font={font} color={textColor} size={8} /> : small(view === 'left' ? 112 : 88, 92, 30));
    else if (shape === 'tent' && view === 'side') marks.push(small(100, 112, 70));
    else {
      const b = logoBox(shape);
      marks.push(small(b.x, b.y, b.w));
      if (text) marks.push(<Text key="t" x={100} y={b.y + b.w * 0.6} text={text} font={font} color={textColor} size={9} />);
    }
  }

  const drawing = (
    <>
      {v.under?.map((p, i) => <path key={`u${i}`} d={p.d} fill={p.stroke ? 'none' : (fillOf(p.fill) ?? 'none')} stroke={p.stroke ? fillOf(p.stroke) : undefined} strokeWidth={p.width} />)}
      <path d={v.body} fill={base} />
      {shape === 'medal' && (
        <>
          <circle cx="100" cy="128" r="56" fill="#C9A44C" stroke="#A9862F" strokeWidth="3" />
          <circle cx="100" cy="128" r="44" fill="none" stroke="#E6CC85" strokeWidth="2" />
        </>
      )}
      <g clipPath={`url(#${id}-clip)`}>
        <Pattern id={id} pattern={pattern} accent={accent} />
      </g>
      {v.over?.map((p, i) => <path key={`o${i}`} d={p.d} fill={fillOf(p.fill)} stroke={p.outline ? '#CFCCC4' : undefined} strokeWidth={p.outline ? 1.5 : undefined} strokeLinejoin="round" />)}
      {trim && v.trim?.map((p, i) => <path key={`t${i}`} d={p.d} fill="none" stroke={accent} strokeWidth={p.width} strokeLinecap="round" />)}
      <path d={v.body} fill="none" stroke="#CFCCC4" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  );

  return (
    <svg className={className} viewBox="-19 -19 238 238" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={v.body} />
        </clipPath>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={base} />
          <stop offset="1" stopColor={accent} />
        </linearGradient>
      </defs>
      {v.mirror ? <g transform="translate(200 0) scale(-1 1)">{drawing}</g> : drawing}
      {marks}
    </svg>
  );
}

/** Saves a blob as a file. */
export function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
