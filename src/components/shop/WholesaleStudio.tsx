'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GICON, LOCN, METALS, SHAPES, TEXT_COLORS, WS_ASSETS, WS_COLORS, WS_FONTS, money, type WsItem } from '@/content/wholesale';
import { ACCEPT, AssetStatus, useUpload } from './BrandAssets';
import type { StudioBrand } from './useStudio';
import type { Wholesale } from './wholesaleStore';
import WsMock, { AssetMark } from './WsMock';
import { DEFAULT_PLAYERS, TF0, TXF0, locsOf, rosterOf, spotOf, spotSummary, type Gfx, type WsDesign } from './wsDesign';
import w from './wholesale.module.css';

const TOOLS: [string, string, string][] = [
  ['edit', 'Logo', '◎'],
  ['text', 'Text', 'T'],
  ['gfx', 'Graphics', '✦'],
  ['roster', 'Names & #', '#'],
  ['upload', 'Upload', '⇪'],
  ['brand', 'Brand', '★'],
  ['templates', 'Layouts', '▦'],
  ['layers', 'Layers', '☰'],
  ['check', 'Print check', '✓'],
];
const PAD: [string, number, number, string][] = [
  ['', 0, 0, ''],
  ['↑', 0, -1, 'Move up'],
  ['', 0, 0, ''],
  ['←', -1, 0, 'Move left'],
  ['●', 0, 0, 'Center'],
  ['→', 1, 0, 'Move right'],
  ['', 0, 0, ''],
  ['↓', 0, 1, 'Move down'],
  ['', 0, 0, ''],
];
const PRESETS = ['COACH', 'STAFF', 'PARENT', 'CAPTAIN', 'EST. 2016', '2026'];
const GCOLORS: [string, string][] = [['', 'Auto'], ...TEXT_COLORS.slice(0, 1), ['#111111', 'Black'], ['#DCBD7D', 'Gold'], ['#7A1F2B', 'Maroon'], ['#1B3A6B', 'Navy']];
const SAMPLE_IDS = WS_ASSETS.map((a) => a.id);

/** The arrows that move something on its spot, centred with ●. */
function Pad({ go }: { go: (dx: number, dy: number, center: boolean) => void }) {
  return (
    <div className={w.pad}>
      {PAD.map(([label, dx, dy, aria], i) =>
        label ? (
          <button key={i} type="button" aria-label={aria} onClick={() => go(dx, dy, label === '●')}>
            {label}
          </button>
        ) : (
          <span key={i} />
        ),
      )}
    </div>
  );
}

function Swatches({ list, value, onPick }: { list: [string, string][]; value: string; onPick: (c: string) => void }) {
  return (
    <div className={w.swatches}>
      {list.map(([c, name]) => (
        <button key={name} type="button" aria-label={name} title={name} aria-pressed={value === c} style={{ background: c || 'conic-gradient(#DCBD7D 0 50%, #111111 0)' }} onClick={() => onPick(c)} />
      ))}
    </div>
  );
}

function Range({ label, txt, min, max, step, value, onChange }: { label: string; txt: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className={w.range}>
      <span>
        <strong>{label}</strong>
        <span>{txt}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/**
 * The Wholesale board's design studio, full screen: the item on its print spot (or every colour at once), the spots
 * along the bottom with the live price, and tools down the side: the logo (its print checks, size, position, rotation,
 * background), text, graphics, names & numbers, uploads, brand assets, layouts, layers and the print check. Undo,
 * redo, zoom, Save draft (in this browser) and Done.
 */
export default function WholesaleStudio({
  item,
  studio,
  ws,
  tool0,
  loc,
  setLoc,
  design: d,
  change,
  undo,
  redo,
  color,
  setColor,
  rost,
  setRost,
  rIdx,
  setRIdx,
  apparel,
  onFillQty,
  onClose,
}: {
  item: WsItem;
  studio: StudioBrand;
  ws: Wholesale;
  tool0: string;
  loc: string;
  setLoc: (l: string) => void;
  design: WsDesign;
  change: (patch: Partial<WsDesign>) => void;
  undo: (() => void) | null;
  redo: (() => void) | null;
  color: string;
  setColor: (c: string) => void;
  rost: string;
  setRost: (t: string) => void;
  rIdx: number;
  setRIdx: (n: number) => void;
  apparel: boolean;
  onFillQty: (n: number) => void;
  onClose: () => void;
}) {
  const [tool, setTool] = useState(tool0);
  const [zoom, setZoom] = useState(100);
  const [allc, setAllc] = useState(false);
  const [saved, setSaved] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const [filled, setFilled] = useState(false);
  const [imported, setImported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sh = SHAPES[item.shape];
  const locs = locsOf(item);
  const { upload, busy, error } = useUpload(studio, ws, (a) => {
    change({ art: { ...d.art, [loc]: a.id } });
    setTool('edit');
  });
  useEffect(() => {
    document.body.classList.add('menu-open');
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', key);
    };
  }, [onClose]);

  const players = rosterOf(rost);
  const player = players[Math.min(rIdx, Math.max(0, players.length - 1))] ?? { name: 'NAME', num: '00' };
  const sel = d.art[loc] ? ws.asset(d.art[loc]) : undefined;
  const word = sel?.kind === 'word';
  const t0 = { ...TF0, ...d.tf[loc] };
  const x0 = { ...TXF0, ...d.txf[loc] };
  const lim = sh.P[loc][2] * 0.82 * 0.45;
  const clamp = (v: number) => Math.max(-lim, Math.min(lim, v));
  const setTf = (patch: Partial<typeof t0>) => change({ tf: { ...d.tf, [loc]: { ...t0, ...patch } } });
  const setTx = (patch: Partial<typeof x0>) => change({ txf: { ...d.txf, [loc]: { ...x0, ...patch } } });
  const inches = sh.P[loc][2] * 0.45 * (t0.s / 100) * (word ? 1.5 : 1);
  const inchTxt = `${inches.toFixed(1)} in wide`;
  const used = locs.filter((l) => d.art[l] || d.txts[l] || d.gfx[l] || d.ros[l]).length;
  const hasRos = locs.some((l) => d.ros[l]);
  const vec = (id: string) => SAMPLE_IDS.includes(id) || Boolean(ws.asset(id)?.vector);
  const gfx = d.gfx[loc];
  const setGfx = (patch: Partial<Gfx> | null) => change({ gfx: { ...d.gfx, [loc]: patch === null ? null : ({ ...gfx!, ...patch } as Gfx) } });

  // The logo's checks (resolution, decoration, approval) and the whole item's print check.
  const logoChecks: [string, string, string, string, string][] = [];
  if (sel) {
    const dpi = sel.px ? Math.round(sel.px / Math.max(0.5, inches)) : 0;
    logoChecks.push(
      vec(sel.id)
        ? ['✓', '#1E7A45', '#F4F9F6', 'Vector art', 'Prints sharp at any size.']
        : !sel.px
          ? ['…', '#C9A44C', '#FBF6EA', 'Checking resolution', 'Hang on a second.']
          : dpi >= 250
            ? ['✓', '#1E7A45', '#F4F9F6', 'Great print quality', `~${dpi} DPI at this size.`]
            : dpi >= 150
              ? ['!', '#C9A44C', '#FBF6EA', 'OK print quality', `~${dpi} DPI. Fine for most prints.`]
              : ['!', '#B03A2E', '#FBEAE8', 'Low print quality', `~${dpi} DPI. Make it smaller or import a bigger file.`],
    );
    const dec = item.deco[0];
    logoChecks.push(
      dec === 'Screen print'
        ? sel.kind === 'img'
          ? ['i', '#555555', '#F7F6F3', 'Full-color art', 'We’ll suggest the best print method on your proof.']
          : ['i', '#555555', '#F7F6F3', '2 ink colors', 'Screen print is priced per color.']
        : dec === 'Embroidery'
          ? ['i', '#555555', '#F7F6F3', 'Embroidered', 'Our team digitizes your logo. Free on reorders.']
          : ['i', '#555555', '#F7F6F3', 'Full color included', `${dec} prints every color at no extra cost.`],
    );
    logoChecks.push(sel.status === 'ok' ? ['✓', '#1E7A45', '#F4F9F6', 'Approved artwork', 'Ready to order.'] : ['!', '#B03A2E', '#FBEAE8', 'Needs a quick check', 'Our team reviews new art before printing.']);
  }
  const pchecks: [string, string, string, string][] = [];
  locs.forEach((l) => {
    const a = d.art[l] ? ws.asset(d.art[l]) : undefined;
    if (!a && !d.txts[l] && !d.gfx[l] && !d.ros[l]) return;
    const nm = LOCN[l];
    if (a) {
      const inc = (sh.P[l][2] * 0.45 * (d.tf[l]?.s ?? 100)) / 100;
      const dpi = a.px ? Math.round(a.px / Math.max(0.5, inc)) : 0;
      pchecks.push(
        vec(a.id) || dpi >= 200
          ? ['✓', '#1E7A45', `${nm}: ${a.name} prints sharp`, vec(a.id) ? 'Vector art.' : `~${dpi} DPI at this size.`]
          : ['!', '#B03A2E', `${nm}: ${a.name} may print blurry`, dpi ? `~${dpi} DPI. Make it smaller or import a bigger file.` : 'We’ll confirm resolution on your proof.'],
      );
      if (a.status !== 'ok') pchecks.push(['!', '#C9A44C', `${nm}: ${a.name} needs a quick check`, 'Our team approves new art before printing, usually within 1 business day.']);
      const t = d.tf[l];
      const lm = sh.P[l][2] * 0.82 * 0.45;
      if (t && (Math.abs(t.dx) > lm * 0.9 || Math.abs(t.dy) > lm * 0.9 || t.s > 140)) pchecks.push(['!', '#C9A44C', `${nm}: close to the edge`, 'Keep artwork inside the dashed print area.']);
    }
    if (d.txts[l] && d.tcol[l] && d.tcol[l].toLowerCase() === color.toLowerCase()) pchecks.push(['!', '#B03A2E', `${nm}: text color matches the item`, 'Pick a different text color so it shows up.']);
    if (d.txts[l] && item.deco[0] === 'Embroidery' && (d.txf[l]?.s ?? 100) < 80) pchecks.push(['!', '#C9A44C', `${nm}: small embroidered text`, 'Text under about ¼ inch tall may not stitch cleanly.']);
    if (d.ros[l]) pchecks.push(players.length ? ['✓', '#1E7A45', `${nm}: names & numbers`, `${players.length} players. Each piece is made for one player.`] : ['!', '#B03A2E', `${nm}: roster is empty`, 'Add players or import your CLP roster.']);
  });
  if (!pchecks.length) pchecks.push(['!', '#999999', 'Nothing on the item yet', 'Add a logo, text or graphic to start.']);
  const bad = pchecks.filter((k) => k[0] !== '✓').length;

  // Layouts: proven placements (apparel), or centred and large.
  const d0 = ws.lg || 'crest';
  const tpls: [string, string, [string, string, Partial<typeof t0>][], string?][] = apparel
    ? [
        ['Player jersey', 'Crest on the chest, names & numbers on the back', [['front', d0, { s: 55, dx: 6, dy: -4 }]], 'back'],
        ['Left chest', 'Small logo over the heart', [['front', d0, { s: 55, dx: 6, dy: -4 }]]],
        ['Big front', 'Bold logo across the chest', [['front', d0, { s: 135 }]]],
        [
          'Chest + back',
          'Left chest logo, wordmark on the back',
          [
            ['front', d0, { s: 55, dx: 6, dy: -4 }],
            ['back', 'word', { s: 100 }],
          ],
        ],
        [
          'Front + sleeve',
          'Center logo plus a sleeve hit',
          (
            [
              ['front', d0, { s: 100 }],
              ['sleeve', d0, { s: 100 }],
            ] as [string, string, Partial<typeof t0>][]
          ).filter((x) => sh.P[x[0]]),
        ],
      ]
    : [
        ['Centered', 'Logo centered on the item', [[locs[0], d0, { s: 100 }]]],
        ['Large', 'Logo as big as it fits', [[locs[0], d0, { s: 140 }]]],
      ];
  const applyTpl = (t: (typeof tpls)[number]) => {
    const art = { ...d.art };
    const tf = { ...d.tf };
    t[2].forEach(([l, id, f]) => {
      art[l] = id;
      tf[l] = { ...TF0, ...f };
    });
    const ros = { ...d.ros };
    if (t[3] && sh.P[t[3]]) {
      ros[t[3]] = true;
      art[t[3]] = '';
    }
    change({ art, tf, ros });
    setLoc(t[3] && sh.P[t[3]] ? t[3] : t[2][0][0]);
    setTool(t[3] && sh.P[t[3]] ? 'roster' : 'edit');
  };
  const snaps: [string, Partial<typeof t0>][] =
    loc === 'front' && apparel
      ? [
          ['Center', { dx: 0, dy: 0 }],
          ['Left chest', { dx: 6, dy: -4, s: 55 }],
        ]
      : loc === 'back'
        ? [
            ['Center', { dx: 0, dy: 0 }],
            ['Upper back', { dx: 0, dy: -7, s: 70 }],
          ]
        : [['Center', { dx: 0, dy: 0 }]];
  const layers = [
    sel ? ['◎', sel.name, `Logo · ${inchTxt}`, 'logo', 'edit'] : null,
    d.txts[loc] ? ['T', `“${d.txts[loc]}”`, `Text · ${WS_FONTS[d.tfont[loc] ?? 'block'][0]}${d.curve[loc] ? ' · curved' : ''}`, 'text', 'text'] : null,
    gfx ? ['✦', GICON[gfx.icon][0], 'Graphic', 'gfx', 'gfx'] : null,
    d.ros[loc] ? ['#', 'Names & numbers', `${players.length} players`, 'roster', 'roster'] : null,
  ].filter(Boolean) as [string, string, string, string, string][];
  const rosLoc = sh.P.back ? 'back' : loc;
  const live = `From ${money(item.price * (1 + Math.max(0, used - 1) * 0.12) + (hasRos ? 4 : 0))}/ea`;
  const liveSub = `${used} ${used === 1 ? 'print spot' : 'print spots'}${hasRos ? ' · names & numbers +$4.00' : ''} · ${item.deco[0]} · final price on your proof`;
  const fonts = Object.entries(WS_FONTS);
  const tools = TOOLS.filter(([id]) => id !== 'roster' || apparel);
  const mockFor = (l: string, c = color) => <WsMock item={item} loc={l} asset={d.art[l] ? ws.asset(d.art[l]) : null} color={c} design={spotOf(d, l, player)} show className={w.cardSvgFull} />;

  return createPortal(
    <div className={w.studio} role="dialog" aria-modal="true" aria-label="Design studio">
      <div className={w.stTop}>
        <span className={w.stTitle}>
          <span className={w.kicker}>DESIGN STUDIO</span>
          <strong>{item.name}</strong>
        </span>
        <div className={w.stMid}>
          <button type="button" className={w.stIcon} aria-label="Undo" disabled={!undo} onClick={() => undo?.()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
            </svg>
          </button>
          <button type="button" className={w.stIcon} aria-label="Redo" disabled={!redo} onClick={() => redo?.()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 14 5-5-5-5" />
              <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
            </svg>
          </button>
          <span className={w.stRule} />
          <button type="button" className={w.stZoom} aria-label="Zoom out" onClick={() => setZoom(Math.max(75, zoom - 25))}>
            −
          </button>
          <span className={w.stZoomTxt}>{zoom}%</span>
          <button type="button" className={w.stZoom} aria-label="Zoom in" onClick={() => setZoom(Math.min(175, zoom + 25))}>
            +
          </button>
        </div>
        <div className={w.stRight}>
          {!sh.fixed && (
            <button type="button" className={w.stBtn} onClick={() => setAllc(!allc)}>
              {allc ? 'Back to design' : 'See all colors'}
            </button>
          )}
          <button
            type="button"
            className={w.stBtn}
            onClick={() => {
              try {
                localStorage.setItem(`clp-wholesale-draft-${item.id}`, JSON.stringify({ design: d, rost, color, at: new Date().toISOString() }));
              } catch {
                // Storage blocked: the design stays on this page.
              }
              setSaved(true);
            }}
          >
            {saved ? '✓ Saved' : 'Save draft'}
          </button>
          <button type="button" className={w.stDone} onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      <div className={w.stBody}>
        <nav className={w.stRail} aria-label="Studio tools">
          {tools.map(([id, label, icon]) => (
            <button key={id} type="button" aria-pressed={tool === id} onClick={() => setTool(id)}>
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className={w.stCanvasCol}>
          <div className={w.stCanvas}>
            {allc ? (
              <div className={w.allColors}>
                {WS_COLORS.map(([c, name]) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={color === c}
                    onClick={() => {
                      setColor(c);
                      setAllc(false);
                    }}
                  >
                    <span className={w.allMock}>{mockFor(loc, c)}</span>
                    {name}
                  </button>
                ))}
              </div>
            ) : (
              <div className={w.stStage} style={{ transform: `scale(${zoom / 100})` }}>
                <span className={w.stMock}>
                  <WsMock item={item} loc={loc} asset={sel} color={color} design={spotOf(d, loc, player)} show area className={w.cardSvgFull} label={`${item.name}, ${LOCN[loc]}`} />
                </span>
                <span className={w.spotTag}>
                  {LOCN[loc]} · up to {(sh.P[loc][2] * 0.45 * 1.8).toFixed(0)} in wide
                </span>
              </div>
            )}
          </div>
          <div className={w.stFoot}>
            <div className={w.stThumbs}>
              {locs.map((l) => {
                const s = spotSummary(d, l, ws.asset, 'Empty');
                return (
                  <button key={l} type="button" aria-pressed={loc === l} onClick={() => setLoc(l)}>
                    <span className={w.stThumb}>{mockFor(l)}</span>
                    <span>
                      <strong>{LOCN[l]}</strong>
                      <span data-has={s !== 'Empty'}>{s}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={w.stLive}>
              <strong>{live}</strong>
              <span>{liveSub}</span>
            </div>
          </div>
        </div>

        <aside className={w.stSide}>
          {tool === 'upload' && (
            <div className={w.stSec}>
              <div className={w.stSecHead}>
                <strong>Import artwork</strong>
                <span>PNG, JPG, WebP or SVG. Vector files print sharpest.</span>
              </div>
              <button type="button" className={w.drop} disabled={busy} onClick={() => fileRef.current?.click()}>
                <strong>{busy ? 'Adding…' : 'Drop a file or browse'}</strong>
                <span>From this computer</span>
              </button>
              <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={upload} />
              <div className={w.upSources}>
                <button type="button" aria-pressed={linkOpen} onClick={() => setLinkOpen(!linkOpen)}>
                  <span style={{ background: '#555555' }}>↗</span>
                  Paste a link
                </button>
                <button type="button" onClick={() => setTool('brand')}>
                  <span style={{ background: '#8A6F33' }}>★</span>
                  Brand assets
                </button>
              </div>
              {linkOpen && (
                <div className={w.linkRow}>
                  <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a link to an image" aria-label="Paste a link" />
                  <button
                    type="button"
                    onClick={() => {
                      const u = link.trim();
                      if (!/^https:\/\//.test(u)) return;
                      const name = (u.split('/').pop() ?? '').split('?')[0].replace(/\.[^.]+$/, '').slice(0, 16) || 'Linked file';
                      const a = { id: `ln${Date.now()}`, name, kind: 'img' as const, src: u, status: 'new' as const, vector: /\.svg(\?|$)/i.test(u) };
                      ws.addUpload(a);
                      change({ art: { ...d.art, [loc]: a.id } });
                      setLink('');
                      setLinkOpen(false);
                      setTool('edit');
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
              {error && (
                <span className={w.error} role="alert">
                  {error}
                </span>
              )}
              <span className={w.fine}>New uploads get a quick check from our team before printing. Your brand assets are already approved.</span>
            </div>
          )}

          {tool === 'brand' && (
            <div className={w.stSec}>
              <div className={w.stSecHead}>
                <strong>Brand assets</strong>
                <span>
                  Pick artwork for <strong>{LOCN[loc]}</strong>.
                </span>
              </div>
              <button type="button" className={w.noArt} aria-pressed={!d.art[loc]} onClick={() => change({ art: { ...d.art, [loc]: '' } })}>
                No artwork on this spot
              </button>
              {ws.assets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={w.assetRow}
                  aria-pressed={d.art[loc] === a.id}
                  onClick={() => {
                    change({ art: { ...d.art, [loc]: a.id } });
                    setTool('edit');
                  }}
                >
                  <AssetMark a={a} />
                  <span>{a.name}</span>
                  <AssetStatus status={a.status} />
                </button>
              ))}
            </div>
          )}

          {tool === 'templates' && (
            <div className={w.stSec}>
              <div className={w.stSecHead}>
                <strong>Layouts</strong>
                <span>Start from a proven placement, then fine-tune.</span>
              </div>
              <div className={w.tpls}>
                {tpls.map((t) => (
                  <button key={t[0]} type="button" onClick={() => applyTpl(t)}>
                    <span className={w.tplMock}>
                      <WsMock item={item} loc={t[2][0][0]} asset={ws.asset(t[2][0][1])} color={color} design={{ tf: { ...TF0, ...t[2][0][2] } }} className={w.cardSvgFull} />
                    </span>
                    <strong>{t[0]}</strong>
                    <span>{t[1]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tool === 'layers' && (
            <div className={w.stSec}>
              <div className={w.stSecHead}>
                <strong>Layers on {LOCN[loc]}</strong>
                <span>Select a layer to edit it, or hide it.</span>
              </div>
              {layers.map(([icon, label, sub, key, tl]) => {
                const hid = Boolean(d.hide[`${loc}:${key}`]);
                return (
                  <div key={key} className={w.layer} data-on={tool === tl}>
                    <button type="button" onClick={() => setTool(tl)}>
                      <span>{icon}</span>
                      <span>
                        <strong>{label}</strong>
                        <span>{sub}</span>
                      </span>
                    </button>
                    <button type="button" className={w.eye} data-hid={hid} aria-label={`${hid ? 'Show' : 'Hide'} ${label}`} onClick={() => change({ hide: { ...d.hide, [`${loc}:${key}`]: !hid } })}>
                      {hid ? 'Show' : 'Hide'}
                    </button>
                  </div>
                );
              })}
              {!layers.length && <span className={w.muted}>Nothing on this spot yet. Add artwork or text.</span>}
            </div>
          )}

          {tool === 'edit' && (
            <div className={w.stSec}>
              <div className={w.stSecRow}>
                <strong>Logo on {LOCN[loc]}</strong>
                <button type="button" className={w.linkBtn} onClick={() => setTool('brand')}>
                  Replace
                </button>
              </div>
              {sel ? (
                <>
                  <div className={w.logoChecks}>
                    {logoChecks.map(([i, dot, bg, t, desc]) => (
                      <div key={t} style={{ background: bg }}>
                        <span style={{ background: dot }}>{i}</span>
                        <span>
                          <strong>{t}</strong>
                          <span>{desc}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <Range label="Size" txt={`${t0.s}% · ≈ ${inchTxt}`} min={40} max={160} step={5} value={t0.s} onChange={(s) => setTf({ s })} />
                  <div className={w.posRow}>
                    <Pad go={(dx, dy, c) => (c ? setTf({ dx: 0, dy: 0 }) : setTf({ dx: clamp(t0.dx + dx * 1.2), dy: clamp(t0.dy + dy * 1.2) }))} />
                    <span className={w.posText}>
                      <strong>Position</strong>
                      <span>{t0.dx || t0.dy ? 'Moved from center. Keep it inside the dashed print area.' : 'Centered on the print spot.'}</span>
                      <span className={w.snaps}>
                        {snaps.map(([label, patch]) => (
                          <button key={label} type="button" onClick={() => setTf(patch)}>
                            {label}
                          </button>
                        ))}
                      </span>
                    </span>
                  </div>
                  <Range label="Rotate" txt={`${t0.r}°`} min={-45} max={45} step={1} value={t0.r} onChange={(r) => setTf({ r })} />
                  {sel.kind === 'img' && (
                    <button type="button" className={w.switchRow} aria-pressed={Boolean(d.nobg[sel.id])} onClick={() => change({ nobg: { ...d.nobg, [sel.id]: !d.nobg[sel.id] } })}>
                      Remove background
                      <span className={w.track}>
                        <span />
                      </span>
                    </button>
                  )}
                </>
              ) : (
                <div className={w.noLogo}>
                  <span className={w.muted}>No logo on this spot yet.</span>
                  <span>
                    <button type="button" className={w.darkSm} onClick={() => setTool('brand')}>
                      Use a brand asset
                    </button>
                    <button type="button" className={w.lightSm} onClick={() => setTool('upload')}>
                      Import a file
                    </button>
                  </span>
                </div>
              )}
            </div>
          )}

          {tool === 'gfx' && (
            <div className={w.stSec}>
              <div className={w.stSecHead}>
                <strong>Graphics on {LOCN[loc]}</strong>
                <span>Sport and team icons that print clean in any method.</span>
              </div>
              <div className={w.gicons}>
                {Object.entries(GICON).map(([k, [label, path]]) => (
                  <button
                    key={k}
                    type="button"
                    aria-label={label}
                    aria-pressed={gfx?.icon === k}
                    onClick={() => change({ gfx: { ...d.gfx, [loc]: { dx: 0, dy: d.art[loc] ? -sh.P[loc][2] * 0.82 * 0.85 : 0, s: d.art[loc] ? 45 : 100, r: 0, color: '', ...(gfx ?? {}), icon: k } } })}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                      <path d={path} fill="#111111" fillRule="evenodd" />
                    </svg>
                    {label}
                  </button>
                ))}
              </div>
              {gfx && (
                <>
                  <div className={w.colorBlock}>
                    <strong>Color</strong>
                    <Swatches list={GCOLORS} value={gfx.color} onPick={(c) => setGfx({ color: c })} />
                  </div>
                  <Range label="Size" txt={`${gfx.s}%`} min={30} max={200} step={5} value={gfx.s} onChange={(s) => setGfx({ s })} />
                  <div className={w.posRow}>
                    <Pad go={(dx, dy, c) => setGfx(c ? { dx: 0, dy: 0 } : { dx: gfx.dx + dx * 1.2, dy: gfx.dy + dy * 1.2 })} />
                    <button type="button" className={w.removeLink} onClick={() => setGfx(null)}>
                      Remove graphic
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {tool === 'roster' && (
            <div className={w.stSec}>
              <div className={w.stSecHead}>
                <strong>Names &amp; numbers</strong>
                <span>Every piece gets its own name and number. Preview each player before you order.</span>
              </div>
              <button
                type="button"
                className={w.importBtn}
                onClick={() => {
                  setRost(`${DEFAULT_PLAYERS}\nNGUYEN, 8\nBROOKS, 5\nDIAZ, 14\nKIM, 2\nHALL, 6\nMORALES, 12\nREYES, 1\nWALSH, 15`);
                  setImported(true);
                }}
              >
                <span>CLP</span>
                {imported ? '✓ 14 players from your team roster' : 'Import from your CLP team roster'}
              </button>
              <label className={w.rostField}>
                Or type one player per line: NAME, NUMBER
                <textarea rows={6} value={rost} onChange={(e) => setRost(e.target.value)} />
              </label>
              <div className={w.rosterNav}>
                <button type="button" aria-label="Previous player" onClick={() => setRIdx((rIdx - 1 + players.length) % Math.max(1, players.length))}>
                  ‹
                </button>
                <span>
                  <strong>
                    {player.name}
                    {player.num ? ` · ${player.num}` : ''}
                  </strong>
                  <span>
                    Previewing {Math.min(rIdx, Math.max(0, players.length - 1)) + 1} of {players.length}
                  </span>
                </span>
                <button type="button" aria-label="Next player" onClick={() => setRIdx((rIdx + 1) % Math.max(1, players.length))}>
                  ›
                </button>
              </div>
              {!d.ros[loc] ? (
                <button
                  type="button"
                  className={w.darkWide}
                  onClick={() => {
                    change({ ros: { ...d.ros, [rosLoc]: true } });
                    setLoc(rosLoc);
                  }}
                >
                  Add names &amp; numbers to {LOCN[rosLoc]}
                </button>
              ) : (
                <>
                  <div className={w.fontGrid}>
                    {fonts.map(([k, [label, ff, fst]]) => (
                      <button key={k} type="button" aria-pressed={(d.tfont[loc] ?? 'block') === k} style={{ fontFamily: ff, fontStyle: fst }} onClick={() => change({ tfont: { ...d.tfont, [loc]: k } })}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <Swatches list={TEXT_COLORS} value={d.tcol[loc] ?? ''} onPick={(c) => change({ tcol: { ...d.tcol, [loc]: c } })} />
                  <button
                    type="button"
                    className={w.lightWide}
                    onClick={() => {
                      onFillQty(players.length);
                      setFilled(true);
                    }}
                  >
                    {filled ? `✓ Added ${players.length} pieces (we match sizes on your proof)` : `Set quantity to ${players.length} pieces`}
                  </button>
                  <button type="button" className={w.removeLink} onClick={() => change({ ros: { ...d.ros, [loc]: false } })}>
                    Remove names &amp; numbers
                  </button>
                </>
              )}
              <span className={w.fine}>Only club owners and admins can import youth rosters. Player names stay private to your club and are only used to make this order.</span>
            </div>
          )}

          {tool === 'check' && (
            <div className={w.stSec}>
              <div className={w.stSecHead}>
                <strong>{bad ? `${bad} ${bad === 1 ? 'thing' : 'things'} to check` : '✓ Ready to print'}</strong>
                <span>We check every spot for print quality, approval, placement and contrast, for {item.deco[0].toLowerCase()}.</span>
              </div>
              {pchecks.map(([i, dot, t, desc]) => (
                <div key={t} className={w.pcheck} style={{ background: dot === '#1E7A45' ? '#F4F9F6' : dot === '#B03A2E' ? '#FBEAE8' : '#FBF6EA' }}>
                  <span style={{ background: dot }}>{i}</span>
                  <span>
                    <strong>{t}</strong>
                    <span>{desc}</span>
                  </span>
                </div>
              ))}
              <span className={w.fine}>A CLP designer still reviews your file and sends a free proof before anything is made.</span>
            </div>
          )}

          {tool === 'text' && (
            <div className={w.stSec}>
              <div className={w.stSecHead}>
                <strong>Text on {LOCN[loc]}</strong>
                <span>Names, COACH, STAFF, a year or a slogan.</span>
              </div>
              <input className={w.textIn} value={d.txts[loc] ?? ''} maxLength={18} placeholder="Type your text" aria-label="Text" onChange={(e) => change({ txts: { ...d.txts, [loc]: e.target.value.toUpperCase().slice(0, 18) } })} />
              <span className={w.snaps}>
                {PRESETS.map((x) => (
                  <button key={x} type="button" onClick={() => change({ txts: { ...d.txts, [loc]: x } })}>
                    {x}
                  </button>
                ))}
              </span>
              <button type="button" className={w.switchLeft} aria-pressed={Boolean(d.curve[loc])} onClick={() => change({ curve: { ...d.curve, [loc]: !d.curve[loc] } })}>
                <span className={w.track}>
                  <span />
                </span>
                Curve the text (arches over the logo)
              </button>
              <div className={w.fontGrid}>
                {fonts.map(([k, [label, ff, fst]]) => (
                  <button key={k} type="button" aria-pressed={(d.tfont[loc] ?? 'block') === k} style={{ fontFamily: ff, fontStyle: fst }} onClick={() => change({ tfont: { ...d.tfont, [loc]: k } })}>
                    {label}
                  </button>
                ))}
              </div>
              <div className={w.colorBlock}>
                <strong>Color</strong>
                <Swatches list={TEXT_COLORS} value={d.tcol[loc] ?? ''} onPick={(c) => change({ tcol: { ...d.tcol, [loc]: c } })} />
              </div>
              <Range label="Size" txt={`${x0.s}%`} min={50} max={200} step={10} value={x0.s} onChange={(s) => setTx({ s })} />
              <div className={w.posRow}>
                <Pad go={(dx, dy, c) => setTx(c ? { dx: 0, dy: 0 } : { dx: x0.dx + dx * 1.2, dy: x0.dy + dy * 1.2 })} />
                <span className={w.muted}>Move the text. It starts under the logo.</span>
              </div>
            </div>
          )}

          <div className={w.stColors}>
            <strong>Item color</strong>
            <Swatches list={sh.fixed ? METALS : WS_COLORS} value={color} onPick={setColor} />
          </div>
          <button
            type="button"
            className={w.resetLink}
            onClick={() =>
              change({
                gfx: { ...d.gfx, [loc]: null },
                ros: { ...d.ros, [loc]: false },
                curve: { ...d.curve, [loc]: false },
                tf: { ...d.tf, [loc]: TF0 },
                txts: { ...d.txts, [loc]: '' },
                txf: { ...d.txf, [loc]: TXF0 },
              })
            }
          >
            Reset {LOCN[loc]}
          </button>
          <span className={w.fine}>This is a preview. Our designers check every file and send you a final proof before anything is made.</span>
        </aside>
      </div>
    </div>,
    document.body,
  );
}
