import SocialIcon from '@/components/ui/SocialIcon';
import type { AuthorSocial, SocialNetwork } from '@/content/types';

/** A social network's name, for its link's label ("Nabil Ahmad on Instagram"). */
const NETWORK_NAMES: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  x: 'X',
  twitter: 'Twitter',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  email: 'email',
};

/**
 * An article author's social links (the article's author card, the author's page): one icon link each, opened in a new
 * tab (an email link opens the mail app). The page styles the list and the links.
 */
export default function AuthorSocials({ name, socials, className, linkClassName }: { name: string; socials: AuthorSocial[]; className?: string; linkClassName?: string }) {
  if (socials.length === 0) return null;
  return (
    <ul className={className} aria-label={`${name} on social media`}>
      {socials.map((s) => (
        <li key={`${s.network}:${s.href}`}>
          <a
            href={s.href}
            className={linkClassName}
            aria-label={`${name} on ${NETWORK_NAMES[s.network] ?? s.network}`}
            {...(s.network === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer nofollow' })}
          >
            <SocialIcon network={s.network} />
          </a>
        </li>
      ))}
    </ul>
  );
}
