'use client';

import { useState } from 'react';
import type { PartnerDonations } from '@/content/partnerPages';
import s from '../partnerPage.module.css';
import DonateDialog from './DonateDialog';

/**
 * The Donate button in a partner page's header (the Donations design: "shown on your page header and About tab"). It
 * opens the same window as the About tab's card. Nothing unless the partner turned donations on.
 */
export default function DonateButton({ name, short, donations }: { name: string; short: string; donations?: PartnerDonations | null }) {
  const [open, setOpen] = useState(false);
  if (!donations) return null;
  return (
    <>
      <button type="button" className={`${s.action} ${s.actionOutline}`} onClick={() => setOpen(true)}>
        Donate
      </button>
      {open && <DonateDialog name={name} short={short} donations={donations} onClose={() => setOpen(false)} />}
    </>
  );
}
