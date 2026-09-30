import BuilderPageView from '@/components/builder/BuilderPageView';
import type { ServiceDetailPage } from '@/content/types';

/** /services/<slug>/: dark title header, the four service cards (team plugin grid) and previous/next links. */
export default function ServiceDetailView({ page }: { page: ServiceDetailPage }) {
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
                    layout: { width: '1200px', colGap: 32, rowGap: 0 },
                    filters: [],
                    items: page.cards.map((card, i) => ({ ...card, id: `${page.slug}-${i}`, tags: [] })),
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
