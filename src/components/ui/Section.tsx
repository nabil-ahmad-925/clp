import type { CSSProperties, ReactNode } from 'react';
import styles from './Section.module.css';

type Props = {
  children: ReactNode;
  id?: string;
  className?: string;
  innerClassName?: string;
  /** Text colour scheme: "light" = white text on a dark/colour background. */
  tone?: 'light' | 'dark';
  background?: string;
  /** "container" keeps content in the 1425px grid; "full" lets it span the viewport. */
  width?: 'container' | 'full';
  style?: CSSProperties;
  as?: 'section' | 'div';
};

/** A full-width band with a background and a centred content container. */
export default function Section({
  children,
  id,
  className,
  innerClassName,
  tone = 'dark',
  background,
  width = 'container',
  style,
  as: Tag = 'section',
}: Props) {
  return (
    <Tag
      id={id}
      className={[styles.section, tone === 'light' ? styles.light : styles.dark, className].filter(Boolean).join(' ')}
      // The header switches to its dark version over light-toned sections.
      data-header-tone={tone === 'light' ? 'light' : 'dark'}
      style={{ background, ...style }}
    >
      <div className={[width === 'container' ? styles.container : styles.full, innerClassName].filter(Boolean).join(' ')}>{children}</div>
    </Tag>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.container, className].filter(Boolean).join(' ')}>{children}</div>;
}
