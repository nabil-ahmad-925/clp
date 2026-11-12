import Link from 'next/link';
import type { BulkItem } from '@/content/bulk';
import { shopHref } from '@/content/storefront';
import DesignGate from './DesignGate';

/**
 * The design studio for anyone who isn't an approved CLP partner (a guest, or a signed-in member): sign in or apply,
 * or ask for a quote on the item instead (their logo files go right after it).
 */
export default function StudioGate({ item, member }: { item: BulkItem; member: boolean }) {
  return (
    <div style={{ minHeight: '60vh', padding: 'calc(var(--header-height) + 40px) 16px 72px', background: '#fff' }} data-header-tone="dark">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 36, lineHeight: 1.1 }}>Design Studio</h1>
        <DesignGate member={member} />
        <Link href={shopHref({ view: 'bulk', item: item.id })} style={{ color: '#111', fontWeight: 700 }}>
          {`Ask for a Quote on ${item.name} →`}
        </Link>
      </div>
    </div>
  );
}
