import type { CSSProperties } from 'react';
import PageHero from '@/components/sections/PageHero';
import { Container } from '@/components/ui/Section';
import type { BuilderPage, BuilderRow } from '@/content/types';
import BuilderBlock from './BuilderBlock';
import styles from './BuilderPageView.module.css';

/**
 * Template for pages rebuilt from the original page-builder layout: the title header followed by
 * rows of columns, each holding blocks (text, spacers, directories, forms, galleries...).
 */
export default function BuilderPageView({ page }: { page: BuilderPage }) {
  return (
    <>
      {page.hero && <PageHero {...page.hero} />}
      <div className={styles.content} data-header-tone="dark">
        {!page.hero && <div className={styles.headerSpace} style={{ paddingTop: page.topSpacing }} aria-hidden />}
        {page.rows.map((row, i) => (
          <Row key={i} row={row} />
        ))}
      </div>
    </>
  );
}

function Row({ row }: { row: BuilderRow }) {
  const style = { paddingTop: row.paddingTop, paddingBottom: row.paddingBottom, paddingLeft: row.paddingSides, paddingRight: row.paddingSides, background: row.background } as CSSProperties;
  const columns = row.columns.map((col, i) => (
    <div key={i} className={styles.column} style={{ '--col-span': col.width ?? '12', textAlign: col.centered ? 'center' : undefined } as CSSProperties}>
      {col.blocks.map((block, j) => (
        <BuilderBlock key={j} block={block} />
      ))}
    </div>
  ));
  return (
    <section id={row.id} className={[styles.row, (row.fullWidth || row.flush) && styles.fullWidth, row.tone === 'light' && styles.light].filter(Boolean).join(' ')} style={style}>
      {row.fullWidth ? <div className={styles.columns}>{columns}</div> : <Container className={styles.columns}>{columns}</Container>}
    </section>
  );
}
