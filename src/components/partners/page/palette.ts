import type { CSSProperties } from 'react';

// --- The partner's colours ----------------------------------------------------------------------------------------------

/** CLP's gold and white: the page's brand buttons and CLP Partner tag unless their own colours are picked. */
export const CLP_GOLD = '#DCBD7D';
export const BUTTON_TEXT = '#FFFFFF';

export const rgbOf = (color: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
};
export const luminance = (c: number[]) => {
  const [r, g, b] = c.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const mix = (c: number[], to: number[], t: number) => c.map((v, i) => Math.round(v + (to[i] - v) * t));
const hexOf = (c: number[]) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

/** The brand buttons' background and text: the picks (as chosen, the admin previews them), else CLP's gold and white. */
export const buttonOf = (background = '', text = '') => ({
  background: rgbOf(background) ? background : CLP_GOLD,
  text: rgbOf(text) ? text : BUTTON_TEXT,
});

/**
 * The page's colours from the partner's (the design's "A little"): their colour for tabs, labels, links and accent
 * buttons (darkened until white text on it reads at 4.5:1), a light tint for tags and a deep shade for the dark cards.
 * The brand buttons (Book a Session, the CLP Partner tag) have their own background and text, whatever the mode.
 */
export function paletteOf(color: string, mode: 'little' | 'off' = 'little', buttonColor = '', buttonText = '') {
  const button = buttonOf(buttonColor, buttonText);
  const buttons = { '--button': button.background, '--button-text': button.text };
  // "Off · CLP default": CLP's black and gold.
  if (mode === 'off') return { '--accent': '#111111', '--accent-label': '#8A6F33', '--accent-tint': '#F3EFE4', '--accent-ink': '#333333', '--accent-deep': '#0A0A0A', ...buttons } as CSSProperties;
  let c = rgbOf(color) ?? [122, 31, 43];
  for (let i = 0; i < 24 && 1.05 / (luminance(c) + 0.05) < 4.5; i++) c = mix(c, [0, 0, 0], 0.1);
  return {
    '--accent': hexOf(c),
    '--accent-label': hexOf(c),
    '--accent-tint': hexOf(mix(c, [255, 255, 255], 0.9)),
    '--accent-ink': hexOf(mix(c, [0, 0, 0], 0.3)),
    '--accent-deep': hexOf(mix(c, [0, 0, 0], 0.3)),
    ...buttons,
  } as CSSProperties;
}
