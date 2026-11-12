'use client';

import { US_STATES, formatAddress, type Address } from '@/content/address';
import type { DeliveryAddressState } from './useDeliveryAddress';
import s from './deliveryAddress.module.css';

/**
 * "Deliver to": the full US address with its ZIP code. A signed-in client picks a saved address or A New Address (with
 * Save This Address to my account); a guest types it. The parent sends `d.check()` with the request and calls
 * `d.keep()` once it went.
 */
export default function DeliveryAddress({ d, title = 'Deliver to' }: { d: DeliveryAddressState; title?: string }) {
  const saved = d.book?.addresses ?? [];
  const set = (change: Partial<Address>) => d.setDraft({ ...d.draft, ...change });
  return (
    <fieldset className={s.box}>
      <legend className={s.legend}>{title}</legend>
      {d.signedIn && saved.length > 0 && (
        <div className={s.saved} role="radiogroup" aria-label="Your saved addresses">
          {saved.map((x) => (
            <label key={x.id} className={s.option} data-on={d.choice === x.id}>
              <input type="radio" name="deliver-to" checked={d.choice === x.id} onChange={() => d.setChoice(x.id)} />
              <span>
                {x.label && <b>{x.label}</b>}
                <span>{formatAddress(x)}</span>
              </span>
            </label>
          ))}
          <label className={s.option} data-on={d.choice === 'new'}>
            <input type="radio" name="deliver-to" checked={d.choice === 'new'} onChange={() => d.setChoice('new')} />
            <span>
              <b>A new address</b>
            </span>
          </label>
        </div>
      )}
      {(d.choice === 'new' || !saved.length) && (
        <div className={s.grid}>
          <label className={`${s.field} ${s.wide}`}>
            Street address
            <input value={d.draft.line1} maxLength={120} autoComplete="address-line1" onChange={(e) => set({ line1: e.target.value })} placeholder="123 Main St" />
          </label>
          <label className={`${s.field} ${s.wide}`}>
            Apartment, suite or building (optional)
            <input value={d.draft.line2} maxLength={120} autoComplete="address-line2" onChange={(e) => set({ line2: e.target.value })} />
          </label>
          <label className={s.field}>
            City
            <input value={d.draft.city} maxLength={80} autoComplete="address-level2" onChange={(e) => set({ city: e.target.value })} />
          </label>
          <label className={s.field}>
            State
            <select value={d.draft.state} autoComplete="address-level1" onChange={(e) => set({ state: e.target.value })}>
              <option value="">Choose…</option>
              {US_STATES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            ZIP code
            <input value={d.draft.postalCode} maxLength={10} inputMode="numeric" autoComplete="postal-code" onChange={(e) => set({ postalCode: e.target.value.replace(/[^\d-]/g, '') })} placeholder="01608" />
          </label>
          {d.signedIn && (
            <>
              <label className={`${s.check} ${s.wide}`}>
                <input type="checkbox" checked={d.save} onChange={(e) => d.setSave(e.target.checked)} />
                Save this address to my account
              </label>
              {d.save && (
                <label className={s.field}>
                  Label (optional)
                  <input value={d.label} maxLength={40} onChange={(e) => d.setLabel(e.target.value)} placeholder="e.g. School" />
                </label>
              )}
            </>
          )}
        </div>
      )}
      {d.problem && (
        <span className={s.error} role="alert">
          {d.problem}
        </span>
      )}
    </fieldset>
  );
}
