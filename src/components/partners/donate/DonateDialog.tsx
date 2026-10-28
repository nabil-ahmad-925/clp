'use client';

import { useEffect, useState } from 'react';
import type { PartnerDonations } from '@/content/partnerPages';
import c from '../contact/contact.module.css';
import { CloseButton } from '../page/CloseButton';
import { Overlay } from '../page/Overlay';
import { PROVIDER_NAMES, dollars, donateUrl, parseAmount, prefillsAmount } from './donate';
import d from './donate.module.css';

type Props = { name: string; short: string; donations: PartnerDonations; onClose: () => void };

/**
 * Support a partner (the Donate button's window): their message, the amounts they suggest (and their own amount when
 * they allow it), then Donate, which opens the partner's own link in a new tab. The money goes straight to the partner:
 * CLP takes 0% and never sees it.
 */
export default function DonateDialog({ name, short, donations, onClose }: Props) {
  const { amounts, custom } = donations;
  // The second suggestion is the one on show, as in the design; a partner with only their own amount starts there.
  const [picked, setPicked] = useState<number | 'custom'>(amounts[1] ?? amounts[0] ?? 'custom');
  const [typed, setTyped] = useState('');
  const amount = picked === 'custom' ? parseAmount(typed) : picked;
  const bad = picked === 'custom' && typed.trim() !== '' && amount === null;
  const provider = PROVIDER_NAMES[donations.provider];
  // Opened over another window (the booking confirmation), Escape closes only this one: it answers first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  return (
    <Overlay onClose={onClose} width={460} label={`Support ${short}`}>
      <div className={c.head}>
        <div className={c.heading}>
          <h2 className={c.title}>Support {short}</h2>
          {donations.message && <span className={c.sub}>{donations.message}</span>}
        </div>
        <CloseButton onClose={onClose} />
      </div>
      <div className={d.body}>
        <span className={d.zero}>CLP takes 0% of donations. Funds go straight to {short}.</span>
        <div className={d.chips} role="group" aria-label="Amount">
          {amounts.map((a) => (
            <button key={a} type="button" className={`${d.chip} ${picked === a ? d.chipOn : ''}`} aria-pressed={picked === a} onClick={() => setPicked(a)}>
              {dollars(a)}
            </button>
          ))}
          {custom && (
            <button type="button" className={`${d.chip} ${picked === 'custom' ? d.chipOn : ''}`} aria-pressed={picked === 'custom'} onClick={() => setPicked('custom')}>
              Custom
            </button>
          )}
        </div>
        {picked === 'custom' && (
          <label className={d.label}>
            Your amount
            <input className={d.custom} inputMode="decimal" autoFocus placeholder="$25" value={typed} aria-invalid={bad} onChange={(e) => setTyped(e.target.value)} />
            {bad && <span style={{ color: '#b03a2e', fontWeight: 400 }}>Enter an amount from $1 to $100,000.</span>}
          </label>
        )}
        {amount === null ? (
          <span className={d.donate} role="button" aria-disabled="true">
            Donate
          </span>
        ) : (
          <a className={d.donate} href={donateUrl(donations, amount)} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            Donate
          </a>
        )}
        <p className={d.where}>
          {prefillsAmount(donations)
            ? `Opens ${provider} with ${amount === null ? 'your amount' : dollars(amount)} filled in.`
            : `Opens ${donations.provider === 'link' ? provider : `${short}’s ${provider} page`} in a new tab, where you confirm your amount${amount === null ? '' : ` (${dollars(amount)} here is a suggestion)`}.`}
        </p>
        <p className={d.fine}>The payment provider may charge its own processing fee. Tax receipts come from {name}, and tax-deductible wording only applies to registered nonprofits.</p>
      </div>
    </Overlay>
  );
}
