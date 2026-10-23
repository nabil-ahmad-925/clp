import { DEFAULT_ROSTER, GICON, LOCN, SHAPES, type WsAsset, type WsItem } from '@/content/wholesale';
import type { SpotDesign } from './WsMock';

type Tf = { dx: number; dy: number; s: number; r: number };
type Txf = { dx: number; dy: number; s: number };
export type Gfx = NonNullable<SpotDesign['gfx']>;
/**
 * A design across an item's print spots (the board's studio): each spot's artwork (an asset id), its move and size,
 * text and its lettering, colour and move, curved text, a graphic, names & numbers, what's hidden, and logos whose
 * background is knocked out.
 */
export type WsDesign = {
  art: Record<string, string>;
  tf: Record<string, Tf>;
  txts: Record<string, string>;
  txf: Record<string, Txf>;
  tfont: Record<string, string>;
  tcol: Record<string, string>;
  hide: Record<string, boolean>;
  nobg: Record<string, boolean>;
  gfx: Record<string, Gfx | null>;
  curve: Record<string, boolean>;
  ros: Record<string, boolean>;
};
export const emptyDesign = (loc: string, lg: string): WsDesign => ({ art: lg ? { [loc]: lg } : {}, tf: {}, txts: {}, txf: {}, tfont: {}, tcol: {}, hide: {}, nobg: {}, gfx: {}, curve: {}, ros: {} });
export const TF0: Tf = { dx: 0, dy: 0, s: 100, r: 0 };
export const TXF0: Txf = { dx: 0, dy: 0, s: 100 };

export type Player = { name: string; num: string };
export const rosterOf = (text: string): Player[] =>
  text
    .split('\n')
    .map((x) => x.split(','))
    .filter((x) => x[0] && x[0].trim())
    .map((x) => ({ name: x[0].trim().toUpperCase().slice(0, 12), num: (x[1] ?? '').trim().slice(0, 2) }));
export const DEFAULT_PLAYERS = DEFAULT_ROSTER;

/** One spot as the mockup draws it. */
export const spotOf = (d: WsDesign, l: string, player: Player | null): SpotDesign => ({
  tf: d.tf[l],
  text: d.txts[l],
  ttf: d.txf[l],
  tfont: d.tfont[l],
  tcol: d.tcol[l],
  hideLogo: d.hide[`${l}:logo`],
  hideText: d.hide[`${l}:text`],
  nobg: Boolean(d.art[l] && d.nobg[d.art[l]]),
  curve: d.curve[l],
  gfx: d.gfx[l] && !d.hide[`${l}:gfx`] ? d.gfx[l] : null,
  roster: d.ros[l] && !d.hide[`${l}:roster`] ? player : null,
});
export const locsOf = (it: WsItem) => Object.keys(SHAPES[it.shape].P);
/** The spots with anything on them. */
export const usedLocs = (it: WsItem, d: WsDesign) => locsOf(it).filter((l) => d.art[l] || d.txts[l] || d.gfx[l] || d.ros[l]);
/** What a spot holds, in a few words (the spot tabs, the studio's thumbnails). */
export const spotSummary = (d: WsDesign, l: string, asset: (id: string) => WsAsset | undefined, empty = 'No artwork') => {
  const a = d.art[l] ? asset(d.art[l]) : undefined;
  return a ? a.name : d.ros[l] ? 'Names & numbers' : d.txts[l] ? `“${d.txts[l]}”` : d.gfx[l] ? GICON[d.gfx[l]!.icon][0] : empty;
};
/** The whole design in words (the studio box on the item page, and the quote request's brief). */
export const designSummary = (it: WsItem, d: WsDesign, asset: (id: string) => WsAsset | undefined, players: number) =>
  usedLocs(it, d)
    .map((l) => {
      const a = d.art[l] ? asset(d.art[l]) : undefined;
      const t = d.tf[l];
      const parts = [
        a ? a.name : '',
        d.ros[l] ? `names & numbers (${players})` : '',
        d.gfx[l] ? GICON[d.gfx[l]!.icon][0].toLowerCase() : '',
        d.txts[l] ? `“${d.txts[l]}”` : '',
      ].filter(Boolean);
      return `${LOCN[l]}: ${parts.join(' + ')}${t && (t.dx || t.dy || t.s !== 100 || t.r) ? ' (adjusted)' : ''}`;
    })
    .join(' · ');
