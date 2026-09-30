import type { IconType } from 'react-icons';
import { FaEnvelope, FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaTwitter, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import type { SocialNetwork } from '@/content/types';

const ICONS: Record<SocialNetwork, IconType> = {
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  facebook: FaFacebookF,
  x: FaXTwitter,
  twitter: FaTwitter,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  email: FaEnvelope,
};

export default function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  const Icon = ICONS[network];
  return <Icon className={className} aria-hidden focusable={false} />;
}
