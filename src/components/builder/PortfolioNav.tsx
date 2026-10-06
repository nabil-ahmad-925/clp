import ServiceNav from '@/components/sections/ServiceNav';
import type { PortfolioNavLink } from '@/content/types';

/** "Previous Partnership / Next Partnership" at the bottom of the partnership pages: the services' band (ServiceNav). */
export default function PortfolioNav({ links }: { links: PortfolioNavLink[] }) {
  return (
    <ServiceNav
      label="Partnerships"
      previous={links.find((l) => l.kind === 'previous')}
      next={links.find((l) => l.kind === 'next')}
    />
  );
}
