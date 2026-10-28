'use client';

import { useState } from 'react';
import type { PartnerDonations } from '@/content/partnerPages';
import DonateDialog from './DonateDialog';
import d from './donate.module.css';

/**
 * "Support [partner]": a card with the partner's message and Donate (About tab, checkout, order and booking
 * confirmations). Nothing unless the partner turned donations on.
 */
export default function SupportCard({ name, short, donations }: { name: string; short: string; donations?: PartnerDonations | null }) {
  const [open, setOpen] = useState(false);
  if (!donations) return null;
  return (
    <div className={d.card}>
      <strong className={d.cardTitle}>Support {short}</strong>
      {donations.message && <span className={d.cardText}>{donations.message}</span>}
      <button type="button" className={`${d.donate} ${d.cardButton}`} onClick={() => setOpen(true)}>
        Donate
      </button>
      {open && <DonateDialog name={name} short={short} donations={donations} onClose={() => setOpen(false)} />}
    </div>
  );
}
