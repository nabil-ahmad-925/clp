import type { PartnerProfile } from '@/content/partners';
import RichText from '@/components/ui/RichText';
import PartnerSocials from './PartnerSocials';
import styles from './Partners.module.css';

/**
 * A partner's profile (WP Speedo Team single page): photo and the member-info table on the left, name,
 * gold divider, description and social links on the right. Below 768px the columns stack and the name
 * moves under the photo.
 */
export default function PartnerProfileView({ page }: { page: PartnerProfile }) {
  const title = (
    <>
      <h1 className={styles.profileTitle}>{page.title}</h1>
      {page.designation && <h4 className={styles.designation}>{page.designation}</h4>}
      <div className={styles.dividerWrap}>
        <div className={styles.divider} />
      </div>
    </>
  );
  return (
    <div className={styles.page} data-header-tone="dark">
      <div className={styles.single}>
        <div className={styles.row}>
          <div className={`${styles.col} ${styles.left}`}>
            {/* The photo box keeps its size even when a partner has no photo. */}
            <div className={styles.photoWrap}>
              <div className={styles.photo}>
                {page.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- the partner's full-size logo
                  <img src={page.image.src} width={page.image.width} height={page.image.height} alt={page.image.alt} fetchPriority="high" />
                )}
              </div>
            </div>
            <div className={styles.mobileOnly}>{title}</div>
            {page.info.length > 0 && (
              <div className={styles.infoWrap}>
                <ul className={styles.info}>
                  {page.info.map((row, i) => (
                    <li key={i}>
                      {/* Rows without a label have only the text, which then sits in the first column. */}
                      {row.label && <strong>{row.label}</strong>}
                      <span>{row.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className={`${styles.col} ${styles.right}`}>
            <div className={styles.inner}>
              <div className={styles.desktopOnly}>{title}</div>
              <RichText html={page.html} className={styles.details} />
              {page.socials.length > 0 && (
                <div className={styles.profileLinks}>
                  <h4>Connect With Me:</h4>
                  <PartnerSocials socials={page.socials} size="profile" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
