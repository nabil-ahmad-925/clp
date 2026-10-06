import BuilderPageView from '@/components/builder/BuilderPageView';
import { serviceArea, serviceTag } from '@/content/serviceDirectories';
import type { ServiceDetailPage } from '@/content/types';

/**
 * /services/<slug>/: dark title header, every listing of the service area (a directory: search, a Service filter,
 * sort and pages, from the listings API; the built-in cards when it has none) and previous/next links.
 */
export default function ServiceDetailView({ page }: { page: ServiceDetailPage }) {
  const area = serviceArea(`/services/${page.slug}/`);
  return (
    <BuilderPageView
      page={{
        path: `/services/${page.slug}/`,
        meta: page.meta,
        hero: { title: page.title, height: 350, backgroundColor: '#0a0a0a' },
        rows: [
          {
            paddingTop: '0px',
            paddingBottom: '0px',
            columns: [
              {
                blocks: [
                  { type: 'divider', height: 25 },
                  {
                    type: 'team',
                    widgetId: area?.widgetId,
                    // Rows as far apart as the columns (a service area can have more than one row of listings).
                    layout: { width: '1200px', colGap: 32, rowGap: 32 },
                    filters: area?.filters ?? [],
                    items: page.cards.map((card, i) => ({ ...card, id: `${page.slug}-${i}`, tags: area ? serviceTag(area, card) : [] })),
                  },
                  { type: 'divider', height: 25 },
                ],
              },
            ],
          },
          { fullWidth: true, columns: [{ blocks: [{ type: 'serviceNav', previous: page.previous, next: page.next }] }] },
        ],
      }}
    />
  );
}
