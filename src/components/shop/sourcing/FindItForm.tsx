'use client';
/* eslint-disable @next/next/no-img-element -- the photo they just uploaded, shown as it is. */

import { useRef } from 'react';
import DeliveryAddress from '../DeliveryAddress';
import b from '../bulk.module.css';
import type { useFindIt } from './useFindIt';
import f from './findIt.module.css';

/** The form's fields: what, photo or link, how many, by when, budget, notes, who (guests), the delivery address. */
export default function FindItForm({ x }: { x: ReturnType<typeof useFindIt> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const err = x.bad;
  return (
    <div className={f.form}>
      <div className={b.block}>
        <strong className={b.stepTitle}>1. What do you need?</strong>
        <label className={b.field}>
          What is it?
          <input value={x.f.what} maxLength={80} aria-invalid={Boolean(err?.what)} placeholder="e.g. Embroidered scrub caps, light-up soccer balls" onChange={x.set('what')} />
        </label>
        <div className={b.attach}>
          <span>A photo of it, or something like it (optional)</span>
          <span className={f.photoRow}>
            {x.photo && <img src={x.photo} alt="Your photo" className={f.photo} />}
            <button type="button" className={f.photoBtn} disabled={x.uploading} onClick={() => fileRef.current?.click()}>
              {x.uploading ? 'Uploading…' : x.photo ? 'Change Photo' : 'Upload Photo'}
            </button>
            {x.photo && (
              <button type="button" className={f.textBtn} onClick={x.clearPhoto}>
                Remove
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void x.onPhoto(e)} />
          </span>
        </div>
        <label className={b.field}>
          Or a link to what you saw (optional)
          <input type="url" value={x.f.link} maxLength={590} aria-invalid={Boolean(err?.link)} placeholder="https://" onChange={x.set('link')} />
        </label>
      </div>
      <div className={b.block}>
        <strong className={b.stepTitle}>2. How many, by when, your budget</strong>
        <div className={f.three}>
          <label className={b.field}>
            Quantity
            <input inputMode="numeric" value={x.f.qty} aria-invalid={Boolean(err?.qty)} placeholder="120" onChange={x.set('qty')} />
          </label>
          <label className={b.field}>
            Budget each, from
            <input inputMode="decimal" value={x.f.min} aria-invalid={Boolean(err?.budget)} placeholder="$8" onChange={x.set('min')} />
          </label>
          <label className={b.field}>
            Up to
            <input inputMode="decimal" value={x.f.max} aria-invalid={Boolean(err?.budget)} placeholder="$10" onChange={x.set('max')} />
          </label>
        </div>
        <label className={b.field}>
          In-hands date (optional)
          <input type="date" value={x.f.inHands} onChange={x.set('inHands')} />
        </label>
        <label className={b.field}>
          Notes
          <textarea rows={3} maxLength={2000} value={x.f.notes} placeholder="Colors, sizes, where the logo goes, anything that helps us find it" onChange={x.set('notes')} />
        </label>
      </div>
      <div className={b.block}>
        <strong className={b.stepTitle}>3. {x.partner ? 'Where it ships' : 'Your details'}</strong>
        {!x.partner && (
          <div className={b.fields}>
            <label className={b.field}>
              Name
              <input value={x.who.name} maxLength={120} autoComplete="name" aria-invalid={Boolean(err?.who) && !x.who.name.trim()} onChange={x.setWhoField('name')} placeholder="Your name" />
            </label>
            <label className={b.field}>
              Organization
              <input value={x.who.organization} maxLength={120} autoComplete="organization" onChange={x.setWhoField('organization')} placeholder="Team, school or company" />
            </label>
            <label className={b.field}>
              Email
              <input type="email" value={x.who.email} maxLength={200} autoComplete="email" aria-invalid={Boolean(err?.who)} onChange={x.setWhoField('email')} placeholder="you@example.com" />
            </label>
          </div>
        )}
        <DeliveryAddress d={x.delivery} />
      </div>
      {x.error && (
        <span className={b.error} role="alert">
          {x.error}
        </span>
      )}
      <div className={b.guestActions}>
        <button type="button" className={b.btnDark} disabled={x.busy || x.uploading} onClick={() => void x.send()}>
          {x.busy ? 'Sending…' : 'Find It for Me'}
        </button>
        <span className={b.finePrint}>Free to ask. Expect our reply within 1 business day.</span>
      </div>
    </div>
  );
}
