import type { CSSProperties } from 'react';
import type { GradientTile } from '@/content/types';
import styles from './GradientTiles.module.css';

/** A row of four bordered gold-to-black tiles, each with a heading and a "View all" button. */
export default function GradientTiles({ tiles }: { tiles: GradientTile[] }) {
  return (
    <div className={styles.grid}>
      {tiles.map((tile, i) => (
        <div key={i} className={styles.tile} style={{ '--tile-to': tile.to } as CSSProperties}>
          <h2 style={{ fontSize: tile.fontSize }}>{tile.title}</h2>
          <a className={styles.button} href={tile.button.href}>
            <span>{tile.button.label}</span>
          </a>
        </div>
      ))}
    </div>
  );
}
