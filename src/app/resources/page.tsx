import type { Metadata } from 'next';
import SportsIndexView from '@/components/pages/SportsIndexView';
import { resourcesIndex } from '@/content/resources';

export const metadata: Metadata = {
  title: { absolute: 'RESOURCES - Compete Like Pros™' },
  alternates: { canonical: '/resources/' },
};

/** The sports' resources, laid out as /experiences/ (see SportsIndexView); each sport's are under /resources/<sport>/. */
export default function ResourcesPage() {
  return <SportsIndexView page={resourcesIndex} />;
}
