import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import styles from './Button.module.css';

type Props = {
  href: string;
  children: ReactNode;
  /** "jumbo" = section call-to-action; "regular" = small in-card button. */
  size?: 'jumbo' | 'regular';
  /** Text colour: white on dark backgrounds, black on light ones. */
  color?: 'light' | 'dark';
  /** Shrinks to the compact padding the feature rows use on phones. */
  compactOnMobile?: boolean;
  newTab?: boolean;
  className?: string;
  style?: CSSProperties;
};

const isInternal = (href: string) => href.startsWith('/') && !href.startsWith('//');

/** Gold gradient-outline button with a gradient fill that sweeps in on hover. */
export default function Button({ href, children, size = 'jumbo', color = 'light', compactOnMobile, newTab, className, style }: Props) {
  const cls = [styles.button, styles[size], styles[color], compactOnMobile && styles.compact, className].filter(Boolean).join(' ');
  const label = <span>{children}</span>;

  if (isInternal(href) && !newTab) {
    return (
      <Link href={href} className={cls} style={style}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} style={style} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener' : undefined}>
      {label}
    </a>
  );
}
