'use client';

import { useState, type ChangeEvent } from 'react';
import { createDesign, sendGuestQuote, uploadGuestImage, type BulkRequest } from '@/content/bulk';
import { uploadImage } from '@/content/partnerSession';
import { findItProblems, sourcingOf, type FindItFields } from '@/content/sourcing';
import { useDeliveryAddress } from '../useDeliveryAddress';
import { imageDataUrl, type StudioBrand } from '../useStudio';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The "Can't Find It?" form: what they need (started from their search), a photo or a link, how many, by when, a
 * budget, notes, who they are (a signed-in client is known) and the full delivery address. Sent as a quote request
 * with `sourcing` (a partner's from their account, anyone else's with this browser's cart).
 */
export function useFindIt(studio: StudioBrand, start: { what: string; loc: string }, onSent: (r: BulkRequest) => void) {
  const partner = studio.partner;
  const [f, setF] = useState<FindItFields>({ what: start.what, qty: '', inHands: '', min: '', max: '', link: '', notes: '' });
  const [who, setWho] = useState({ name: studio.user?.name ?? '', organization: '', email: studio.user?.email ?? '' });
  const [photo, setPhoto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<BulkRequest | null>(null);
  const delivery = useDeliveryAddress(Boolean(studio.user), start.loc);
  const bad = { ...findItProblems(f), who: partner || (who.name.trim() && EMAIL.test(who.email.trim())) ? '' : 'Enter your name and a valid email.' };

  const set = (k: keyof FindItFields) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setWhoField = (k: keyof typeof who) => (e: { target: { value: string } }) => setWho((x) => ({ ...x, [k]: e.target.value }));

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      setPhoto(partner ? await uploadImage(file) : await uploadGuestImage(await imageDataUrl(file, 1500)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That photo didn’t upload. Try a PNG or JPG.');
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    setTried(true);
    setError('');
    const address = delivery.check();
    const first = Object.values(bad).find(Boolean);
    if (first) return setError(first);
    if (!address) return setError('Enter the full delivery address with its ZIP code.');
    setBusy(true);
    try {
      const contact = partner
        ? { name: '', organization: '', email: '', inHands: f.inHands, message: '', logoLink: '', address }
        : { name: who.name.trim(), organization: who.organization.trim(), email: who.email.trim(), inHands: f.inHands, message: '', logoLink: '', address };
      const input = { itemId: 'custom', kind: 'quote' as const, styles: [], qty: Number(f.qty), priorities: [], brief: f.notes.trim(), contact, sourcing: sourcingOf(f, photo) };
      const r = partner ? await createDesign(input) : await sendGuestQuote(input);
      setSent(r);
      onSent(r);
      // A new address they asked to keep goes on their account (never failing the request).
      void delivery.keep();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send it. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return { partner, f, set, who, setWhoField, photo, clearPhoto: () => setPhoto(''), onPhoto, uploading, busy, error, bad: tried ? bad : null, delivery, send, sent };
}
