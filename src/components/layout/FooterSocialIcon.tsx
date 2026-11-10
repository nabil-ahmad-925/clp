import type { ReactNode } from 'react';
import type { SocialNetwork } from '@/content/types';

/**
 * The footer's social glyphs, drawn as in the new design's footer (every board's): Instagram as an outline, the others
 * solid, each at the design's size inside its 60px box.
 */
const GLYPHS: Partial<Record<SocialNetwork, { size: number; svg: ReactNode }>> = {
  instagram: {
    size: 42,
    svg: (
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  linkedin: {
    size: 42,
    svg: (
      <g fill="currentColor">
        <rect x="3" y="9" width="4" height="12" />
        <circle cx="5" cy="5" r="2.3" />
        <path d="M10 9h3.8v1.8c.6-1.1 2-2.1 4-2.1 3.5 0 4.2 2.3 4.2 5.3V21h-4v-6.2c0-1.5 0-3.3-2-3.3s-2.1 1.5-2.1 3.2V21H10z" />
      </g>
    ),
  },
  facebook: {
    size: 42,
    svg: <path fill="currentColor" d="M13.5 22v-8.4h2.8l.5-3.4h-3.3V8.1c0-1 .3-1.7 1.7-1.7h1.8V3.3c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.5H7.1v3.4H10V22z" />,
  },
  x: {
    size: 38,
    svg: <path fill="currentColor" d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.5z" />,
  },
  tiktok: {
    size: 40,
    svg: <path fill="currentColor" d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.4 6.4 0 1 0 5.4 6.3V8.6a8.2 8.2 0 0 0 4.4 1.3V6.5a4.6 4.6 0 0 1-4.4-4.5z" />,
  },
  youtube: {
    size: 48,
    svg: (
      <>
        <path
          fill="currentColor"
          d="M22.5 7.2a2.8 2.8 0 0 0-2-2C18.8 4.8 12 4.8 12 4.8s-6.8 0-8.5.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 4.8 2.8 2.8 0 0 0 2 2c1.7.4 8.5.4 8.5.4s6.8 0 8.5-.4a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-4.8z"
        />
        <path fill="#000" d="m9.8 15.2 5.7-3.2-5.7-3.2z" />
      </>
    ),
  },
};

/** One network's glyph; `--icon-scale` (the footer's CSS) shrinks them together on smaller screens. */
export default function FooterSocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  const glyph = GLYPHS[network];
  if (!glyph) return null;
  return (
    <svg
      className={className}
      style={{ width: `calc(${glyph.size}px * var(--icon-scale, 1))`, height: `calc(${glyph.size}px * var(--icon-scale, 1))` }}
      viewBox="0 0 24 24"
      aria-hidden
      focusable={false}
    >
      {glyph.svg}
    </svg>
  );
}
