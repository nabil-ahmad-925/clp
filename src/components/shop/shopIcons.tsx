import type { ReactNode } from 'react';

/** The bulk categories' line icons (the design's), drawn in the current colour. */
const PATHS: Record<string, ReactNode> = {
  shirt: <path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z" />,
  sock: (
    <>
      <path d="M9 2h7v9l-5 8a3 3 0 0 1-5-3l3-5z" />
      <path d="M9 6h7" />
    </>
  ),
  bib: (
    <>
      <path d="M7 3h10l2 4v14H5V7z" />
      <path d="M9 3a3 3 0 0 0 6 0" />
    </>
  ),
  staff: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </>
  ),
  tent: (
    <>
      <path d="M12 3 2 20h20z" />
      <path d="M12 3v17M9 20l3-6 3 6" />
    </>
  ),
  arch: (
    <>
      <path d="M3 21V12a9 9 0 0 1 18 0v9" />
      <path d="M7 21v-9a5 5 0 0 1 10 0v9" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="15" r="6" />
      <path d="m9 3 3 6 3-6M7 3h10" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="1" />
      <path d="M3 12h18M12 8v13M12 8s-2-5-5-5a2 2 0 0 0 0 4h5M12 8s2-5 5-5a2 2 0 0 1 0 4h-5" />
    </>
  ),
};

export function CategoryIcon({ icon, size = 30 }: { icon: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[icon] ?? PATHS.gift}
    </svg>
  );
}

export const Arrow = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Chevron = ({ className, color = 'currentColor' }: { className?: string; color?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const SearchIcon = ({ size = 22, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

export const SortIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />
  </svg>
);

export const LockIcon = ({ size = 12, stroke = '#DCBD7D' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
