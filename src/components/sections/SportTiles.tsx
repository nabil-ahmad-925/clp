import Button from '@/components/ui/Button';
import { Container } from '@/components/ui/Section';
import type { Cta } from '@/content/types';
import styles from './SportTiles.module.css';

export type SportTile = { title: string; subtitle: string; image: string; cta: Cta; wide?: boolean };

/** Black band with a row of bordered photo tiles linking to each sport. */
export default function SportTiles({ tiles }: { tiles: SportTile[] }) {
  return (
    <section className={styles.band} data-header-tone="light">
      <Container>
        <div className={styles.grid}>
          {tiles.map((tile) => (
            <div key={tile.title} className={`${styles.tile} ${tile.wide ? styles.wide : ''}`}>
              <div className={styles.bg} style={{ backgroundImage: `url(${tile.image})` }} aria-hidden />
              <div className={styles.overlay} aria-hidden />
              <div className={styles.content}>
                <h2>{tile.title}</h2>
                <h4>{tile.subtitle}</h4>
                <Button href={tile.cta.href} newTab={tile.cta.newTab} className={styles.button}>
                  {tile.cta.label}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
