'use client';

import { useId } from 'react';
import { GICON, METALS, SHAPES, WS_FONTS, drawnSpot, isLightColor, photoSpot, type PhotoItem, type WsAsset } from '@/content/wsDrawing';

/** What's on a print spot: the logo's move and size, text, a graphic, a player's name and number. */
export type SpotDesign = {
  tf?: { dx: number; dy: number; s: number; r: number };
  text?: string;
  ttf?: { dx: number; dy: number; s: number };
  tfont?: string;
  tcol?: string;
  hideLogo?: boolean;
  hideText?: boolean;
  nobg?: boolean;
  curve?: boolean;
  gfx?: { icon: string; dx: number; dy: number; s: number; r: number; color: string } | null;
  roster?: { name: string; num: string } | null;
};

/**
 * The Wholesale board's mockup: the item drawn in its colour on a 100×100 canvas, with the logo (a badge, a wordmark
 * or an image), text (straight or curved), a graphic and names & numbers on one print spot. All SVG, so the studio
 * can save it as a picture for a quote. `area` draws the spot's dashed print area (the studio).
 */
export default function WsMock({
  item,
  loc,
  asset,
  color,
  design = {},
  show = true,
  area = false,
  className,
  label,
}: {
  /** The item drawn (its shape), or shown as its front or back photo with the logo at that photo's spot. */
  item: PhotoItem;
  loc?: string;
  asset?: WsAsset | null;
  color: string;
  design?: SpotDesign;
  show?: boolean;
  area?: boolean;
  className?: string;
  label?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const sh = SHAPES[item.shape];
  // A medal is metal: gold, silver or bronze, never the item colour.
  const fill = sh.fixed ? (METALS.some(([c]) => c === color) ? color : sh.fixed) : color;
  const light = isLightColor(fill);
  // The item's photo (front or back) when one shows this print spot (the logo at CLP's spot on it), else the drawing.
  const photo = photoSpot(item, loc);
  const { x: px, y: py, w: w0 } = photo ?? drawnSpot(item.shape, loc);
  const a = show && asset && !design.hideLogo ? asset : null;
  const t = { dx: 0, dy: 0, s: 100, r: 0, ...design.tf };
  const tt = { dx: 0, dy: 0, s: 100, ...design.ttf };
  const font = WS_FONTS[design.tfont ?? 'block'] ?? WS_FONTS.block;
  const w = w0 * (t.s / 100);
  const word = a?.kind === 'word';
  const cx = px + t.dx;
  const cy = py + t.dy;
  const aw = w0 * (word ? 2.1 : 1.8);
  const fg = light ? '#111111' : '#FFFFFF';
  const tcol = design.tcol || fg;
  const text = show && design.text && !design.hideText ? design.text : '';
  const gfx = show && design.gfx ? design.gfx : null;
  const roster = show && design.roster ? design.roster : null;
  const lw = word ? w * 1.5 : w;
  const fs = word ? w * 0.165 : w * ((a?.mono ?? '').length > 2 ? 0.3 : 0.44);
  return (
    <svg viewBox="0 0 100 100" className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill={light ? '#E6E4DE' : '#F4F3F0'} />
      {photo ? (
        // Cropped to the square, as CLP placed the logo on it (Add Product › Wholesale item).
        <image href={photo.src} width="100" height="100" preserveAspectRatio="xMidYMid slice" />
      ) : (
        <g transform="translate(9 9) scale(0.82)">
          <path d={sh.d} fill={fill} stroke={light ? '#BDBAB2' : 'rgba(0,0,0,0.3)'} strokeWidth="0.8" strokeLinejoin="round" fillRule="evenodd" />
          {sh.d2 && <path d={sh.d2} fill="none" stroke={light ? '#BDBAB2' : 'rgba(0,0,0,0.3)'} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />}
        </g>
      )}
      {area && show && (
        <rect x={px - aw / 2} y={py - aw * (word ? 0.32 : 0.5)} width={aw} height={word ? aw * 0.64 : aw} rx="1" fill="none" stroke="#DCBD7D" strokeWidth="0.5" strokeDasharray="1.6 1.2" />
      )}
      {a && (
        <g transform={`rotate(${t.r} ${cx} ${cy})`}>
          {a.kind === 'img' && a.src ? (
            <image href={a.src} x={cx - lw / 2} y={cy - lw / 2} width={lw} height={lw} preserveAspectRatio="xMidYMid meet" style={design.nobg ? { mixBlendMode: 'multiply' } : undefined} />
          ) : word ? (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={fg} fontFamily={WS_FONTS.block[1]} fontWeight={800} fontStyle="italic" fontSize={fs} style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              {(a.word ?? '').toUpperCase()}
            </text>
          ) : (
            <>
              <circle cx={cx} cy={cy} r={lw / 2} fill={a.bg ?? '#111111'} stroke="#FFFFFF" strokeWidth="0.6" />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontFamily={WS_FONTS.block[1]} fontWeight={800} fontStyle="italic" fontSize={fs}>
                {a.mono}
              </text>
            </>
          )}
        </g>
      )}
      {gfx && GICON[gfx.icon] && (
        <g transform={`translate(${px + gfx.dx} ${py + gfx.dy}) rotate(${gfx.r || 0}) scale(${(w0 * 0.55 * (gfx.s / 100)) / 24}) translate(-12 -12)`}>
          <path d={GICON[gfx.icon][1]} fill={gfx.color || (light ? '#111111' : '#DCBD7D')} fillRule="evenodd" />
        </g>
      )}
      {roster && (
        <g fill={tcol} fontFamily={font[1]} fontStyle={font[2]} fontWeight={800} textAnchor="middle">
          <text x={px} y={py + (a ? w * 0.75 : 0) - w0 * 0.2} fontSize={w0 * 0.16} style={{ letterSpacing: '0.08em' }}>
            {roster.name}
          </text>
          <text x={px} y={py + (a ? w * 0.75 : 0) + w0 * 0.42} fontSize={w0 * 0.62}>
            {roster.num}
          </text>
        </g>
      )}
      {text &&
        (design.curve ? (
          (() => {
            const cw = (Math.max(30, w0 * 1.7) * tt.s) / 100;
            const ccy = cy - (a ? w * 0.62 : 0) + tt.dy;
            const tx = cx + tt.dx;
            return (
              <g transform={`translate(${tx - cw / 2} ${ccy - (cw * 0.4) / 2}) scale(${cw / 200})`}>
                <path id={`cv${uid}`} d="M12 74 Q100 0 188 74" fill="none" />
                <text fontFamily={font[1]} fontStyle={font[2]} fontWeight={800} fontSize={Math.min(44, 300 / Math.max(4, text.length + 2))} letterSpacing="3" fill={tcol} textAnchor="middle">
                  <textPath href={`#cv${uid}`} startOffset="50%">
                    {text}
                  </textPath>
                </text>
              </g>
            );
          })()
        ) : (
          <text
            x={cx + tt.dx}
            y={cy + (a ? (word ? w * 0.32 : w * 0.72) : 0) + 1.5 + tt.dy}
            transform={`rotate(${t.r} ${cx} ${cy})`}
            textAnchor="middle"
            dominantBaseline="central"
            fill={tcol}
            fontFamily={font[1]}
            fontStyle={font[2]}
            fontWeight={800}
            fontSize={(Math.max(2.2, w0 * 0.2) * tt.s) / 100}
            style={{ letterSpacing: '0.06em' }}
          >
            {text}
          </text>
        ))}
    </svg>
  );
}

/** A brand asset's small mark (the board's 36 px square): its badge, wordmark or image. */
export function AssetMark({ a, size = 36 }: { a?: WsAsset | null; size?: number }) {
  if (!a) return <span style={{ display: 'inline-flex', width: size, height: size, borderRadius: 8, border: '1px dashed #CFCCC4', background: '#FFFFFF', flex: `0 0 ${size}px` }} />;
  return (
    <span
      style={{
        display: 'inline-flex',
        flex: `0 0 ${size}px`,
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '1px solid #E5E5E2',
        borderRadius: 8,
        background: '#FFFFFF',
      }}
    >
      {a.kind === 'img' ? (
        // eslint-disable-next-line @next/next/no-img-element -- an upload, shown as it is.
        <img src={a.src} alt="" style={{ maxWidth: '80%', maxHeight: '80%', display: 'block', objectFit: 'contain' }} />
      ) : a.kind === 'badge' ? (
        <span
          style={{
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: '50%',
            background: a.bg,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: WS_FONTS.block[1],
            fontWeight: 800,
            fontStyle: 'italic',
            fontSize: size * 0.25,
          }}
        >
          {a.mono}
        </span>
      ) : (
        <span style={{ fontFamily: WS_FONTS.block[1], fontWeight: 800, fontStyle: 'italic', fontSize: size * 0.19, lineHeight: 1.05, textAlign: 'center', textTransform: 'uppercase', color: '#111111' }}>{a.word}</span>
      )}
    </span>
  );
}
