import Link from 'next/link';
import { footerLinks, site, socialLinks } from '@/content/site';
import FooterSocialIcon from './FooterSocialIcon';
import styles from './SiteFooter.module.css';

/**
 * The site's footer, as on every new design board: the social icons, the two rows of links on black, then the gold
 * copyright band.
 */
export default function SiteFooter() {
  return (
    <footer className={styles.footer} data-header-tone="light">
      <div className={styles.main}>
        <ul className={styles.social}>
          {socialLinks.map((s) => (
            <li key={s.network}>
              <a href={s.href} target="_blank" rel="noopener" aria-label={`CLP on ${s.label}`}>
                <FooterSocialIcon network={s.network} />
              </a>
            </li>
          ))}
        </ul>

        <nav className={styles.links} aria-label="Footer">
          {footerLinks.map((group, i) => (
            <ul key={i}>
              {group.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link href={link.href}>{link.label}</Link>
                  ) : (
                    <a href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener' : undefined}>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </nav>
      </div>

      <div className={styles.copyright}>
        <p className={styles.copyLine}>
          {site.copyright.line}{' '}
          <a href={site.copyright.poweredBy.href} target="_blank" rel="noopener">
            {site.copyright.poweredBy.label}
          </a>
        </p>
        <p className={styles.trademark}>{site.copyright.trademark}</p>
      </div>
    </footer>
  );
}
