import type { Metadata } from 'next';
import SportsIndexView from '@/components/pages/SportsIndexView';
import { experiencesIndex } from '@/content/experiences';

export const metadata: Metadata = {
  title: { absolute: 'EXPERIENCES - Compete Like Pros™' },
  alternates: { canonical: '/experiences/' },
};

/** The sports' experiences, laid out as a sport's page (see SportsIndexView). */
export default function ExperiencesPage() {
  return <SportsIndexView page={experiencesIndex} />;
}
