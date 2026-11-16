'use client';

import type { BulkRequest } from '@/content/bulk';
import type { PhotoItem } from '@/content/wsDrawing';
import { logoPicture } from './fileWords';
import WsMock from './WsMock';
import w from './wholesale.module.css';

/**
 * Their uploaded logo drawn on the item they chose (the client's rules: a logo preview on the product as they send
 * their files). Only when the studio made no mockup (that one already shows their design) and a logo picture (PNG,
 * JPG) was sent. The proof, not this, shows the exact placement and size.
 */
export default function LogoOnItem({ r, item, color }: { r: BulkRequest; item?: PhotoItem; color: string }) {
  const v = logoPicture(r.files ?? {});
  if (r.mockup || !item || !v?.url) return null;
  return (
    <span style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
      <span style={{ width: 64, height: 64, flex: 'none', borderRadius: 8, border: '1px solid #ebe8e1', overflow: 'hidden', background: '#fff' }}>
        <WsMock item={item} asset={{ id: 'sent-logo', name: v.name, kind: 'img', src: v.url, status: 'ok' }} color={r.design?.base || color} className={w.cardSvgFull} label={`Your logo on the ${r.itemName}`} />
      </span>
      <span>Your logo on the item, as a preview. Your proof shows the exact placement and size.</span>
    </span>
  );
}
