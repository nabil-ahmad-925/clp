import type { IconType } from 'react-icons';
import { FaEnvelope, FaFacebookF, FaFacebookSquare, FaGlobe, FaInstagram, FaLinkedin, FaLinkedinIn, FaPinterest, FaTiktok, FaTwitter, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import type { PartnerSocial } from '@/content/partners';
import styles from './Partners.module.css';

/** The plugin's brand colours (--wps-<network>) and Font Awesome icons. */
const NETWORKS: Record<string, { icon?: IconType; color: string }> = {
  facebook: { icon: FaFacebookSquare, color: '#1877f2' },
  'facebook-f': { icon: FaFacebookF, color: '#1877f2' },
  instagram: { icon: FaInstagram, color: '#da004f' },
  linkedin: { icon: FaLinkedin, color: '#0077b5' },
  'linkedin-in': { icon: FaLinkedinIn, color: '#0077b5' },
  youtube: { icon: FaYoutube, color: 'red' },
  'x-twitter': { icon: FaXTwitter, color: '#000' },
  twitter: { icon: FaTwitter, color: '#1da1f2' },
  tiktok: { icon: FaTiktok, color: '#25f4ee' },
  pinterest: { icon: FaPinterest, color: '#e60023' },
  envelope: { icon: FaEnvelope, color: '#2d3742' },
  globe: { icon: FaGlobe, color: '#2d3742' },
};
// Links saved without a network show as a plain dark circle on the original.
const fallback: { icon?: IconType; color: string } = { color: '#2d3742' };

/** Round social buttons ("wps--social-links", circle shape, brand background). */
export default function PartnerSocials({ socials, size }: { socials: PartnerSocial[]; size: 'card' | 'profile' }) {
  return (
    <ul className={`${styles.socials} ${size === 'profile' ? styles.socialsProfile : ''}`}>
      {socials.map((s, i) => {
        const { icon: Icon, color } = NETWORKS[s.network] ?? fallback;
        return (
          <li key={i}>
            <a href={s.href} aria-label="Social Link" rel="nofollow noopener noreferrer" target="_blank" style={{ backgroundColor: color }}>
              {Icon && <Icon aria-hidden />}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
