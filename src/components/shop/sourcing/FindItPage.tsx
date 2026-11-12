'use client';

import Link from 'next/link';
import type { BulkRequest } from '@/content/bulk';
import { budgetWords } from '@/content/sourcing';
import { shopHref } from '@/content/storefront';
import s from '../shop.module.css';
import type { StudioBrand } from '../useStudio';
import FindItForm from './FindItForm';
import FindingSteps, { FIND_STEPS } from './FindingSteps';
import { useFindIt } from './useFindIt';
import f from './findIt.module.css';

/**
 * "Can't Find It?" (/shop/?view=bulk&find=1, from the empty search or the catalog's last card): tell us what you
 * need and we find it through our makers, suppliers and the web. Sent, it shows "Finding it for you" with its steps,
 * and it's in Quote Requests with every update.
 */
export default function FindItPage({ studio, what, loc, onSent }: { studio: StudioBrand; what: string; loc: string; onSent: (r: BulkRequest) => void }) {
  const x = useFindIt(studio, { what, loc }, onSent);
  const r = x.sent;
  return (
    <>
      <section className={s.thinBand} data-header-tone="light" />
      <section className={`${s.section} ${s.productSection}`}>
        <nav className={`${s.crumbs} ${s.crumbsLight}`} aria-label="Breadcrumb">
          <Link href={shopHref()}>Shop</Link>
          {'  ›  '}
          <Link href={shopHref({ view: 'bulk', loc })}>Wholesale</Link>
          {'  ›  '}
          Can’t Find It?
        </nav>
        <div className={s.productLayout}>
          <div className={f.form}>
            <div className={f.head}>
              <span className={f.kicker}>CAN’T FIND IT?</span>
              <h1 className={f.title}>{r ? 'We’re Finding It for You' : 'Tell Us What You Need'}</h1>
              <p className={f.lead}>
                {r
                  ? `Thanks. Your request ${r.ref ?? ''} for ${r.qty} × ${r.sourcing?.what ?? r.itemName} is with our sourcing team.`
                  : 'Send a photo or a link, how many and when. We’ll find it through our makers, suppliers and the web, and send you one simple quote.'}
              </p>
            </div>
            {r ? (
              <div className={f.done}>
                <FindingSteps steps={r.sourcing?.steps ?? FIND_STEPS} />
                {r.sourcing && budgetWords(r.sourcing) && <p className={f.note}>Your budget: {budgetWords(r.sourcing)}.</p>}
                <p className={f.note}>Expect our reply within 1 business day. Your quote shows in Quote Requests with every update.</p>
                <span className={f.doneBtns}>
                  <Link href={shopHref({ view: 'bulk', reqs: '1' })} className={s.btnDark}>
                    See My Quote Requests
                  </Link>
                  <Link href={shopHref({ view: 'bulk', loc })} className={f.light}>
                    Back to Wholesale
                  </Link>
                </span>
              </div>
            ) : (
              <FindItForm x={x} />
            )}
          </div>
          <aside className={f.aside} aria-label="How it works">
            <span className={f.kicker}>HOW IT WORKS</span>
            <FindingSteps steps={FIND_STEPS} />
            <p className={f.note}>You see one price per piece, the timing and the total. Approve it and it’s made like any other order: your files, a proof, then production and shipping.</p>
          </aside>
        </div>
      </section>
      <div className={s.bottomSpace} />
    </>
  );
}
