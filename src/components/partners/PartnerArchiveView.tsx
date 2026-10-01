import Link from 'next/link';
import type { PartnerArchive } from '@/content/partners';
import PartnerSocials from './PartnerSocials';
import styles from './Partners.module.css';

/** The partner directory (WP Speedo Team archive): "Archives: Partners", a three-column card grid, page links. */
export default function PartnerArchiveView({ page }: { page: PartnerArchive }) {
  return (
    <div className={styles.page} data-header-tone="dark">
      <div className={styles.archiveHead}>
        <h1>
          Archives: <span>{page.title}</span>
        </h1>
      </div>
      <div className={styles.archive}>
        <div className={styles.row}>
          {page.cards.map((card) => (
            <div key={card.href} className={`${styles.col} ${styles.item}`}>
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardPhotoWrap}>
                    <div className={styles.cardPhoto}>
                      <Link href={card.href} aria-label={`Read More about ${card.title}.`}>
                        {card.image && (
                          // eslint-disable-next-line @next/next/no-img-element -- the partner's logo, cropped to a circle
                          <img src={card.image.src} width={card.image.width} height={card.image.height} alt={card.image.alt} loading="lazy" />
                        )}
                      </Link>
                    </div>
                  </div>
                  <h3 className={styles.cardTitle}>
                    <Link href={card.href}>{card.title}</Link>
                  </h3>
                  {card.designation && <h4 className={styles.cardDesignation}>{card.designation}</h4>}
                  <div className={styles.dividerWrap}>
                    <div className={styles.divider} />
                  </div>
                  <div className={styles.excerpt}>
                    <p>{card.excerpt}</p>
                  </div>
                  {card.socials.length > 0 && (
                    <div className={styles.cardLinks}>
                      <PartnerSocials socials={card.socials} size="card" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {page.pagination.length > 0 && (
          <nav className={styles.pagination} aria-label="Partners pages">
            <ul>
              {page.pagination.map((p) => (
                <li key={p.label}>
                  {p.href ? (
                    <Link href={p.href}>{p.label}</Link>
                  ) : (
                    <span className={styles.current} aria-current="page">
                      {p.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
