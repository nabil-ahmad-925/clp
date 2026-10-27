'use client';

import { useEffect, useState } from 'react';
import { useSiteUser } from '@/components/account/useSiteUser';
import type { PartnerPageData } from '@/content/partnerPages';
import { clpOptIns, subscribe, unsubscribe } from '@/content/subscriptions';
import type { Channel } from './consentText';
import { channelsOf, initialForm, missingItem, switchWho, toInput, type SubscribeFormState, type Who } from './subscribeForm';
import { forgetSubscription, saveSubscription, useSavedSubscription } from './subscriptionStore';

const splitName = (name = '') => {
  const [first = '', ...rest] = name.trim().split(/\s+/);
  return { firstName: first, lastName: rest.join(' ') };
};

/**
 * The Subscribe window's state: the form (a signed-in member's name and email filled in), the CLP channels they already
 * opted in to (checked for signed-in members only: a typed email never reveals whether it's subscribed), and
 * subscribing or unsubscribing, which change the page's count (`onCount`).
 */
export function useSubscribe(page: PartnerPageData, smsAddon: boolean, onCount: (n: number) => void) {
  const user = useSiteUser();
  const saved = useSavedSubscription(page.slug);
  const [form, setForm] = useState<SubscribeFormState>(() => initialForm(user ? { ...splitName(user.name), email: user.email } : {}));
  const [clpOn, setClpOn] = useState<Record<Channel, boolean>>({ email: false, sms: false });
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const signedIn = Boolean(user);

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    clpOptIns().then(
      (on) => live && setClpOn(on),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [signedIn]);

  const channels = channelsOf(form, smsAddon);
  const change = (patch: Partial<SubscribeFormState>) => setForm((f) => ({ ...f, ...patch }));
  const setWho = (who: Who) => setForm((f) => switchWho(f, who));

  const submit = async () => {
    if (missingItem(form, smsAddon)) return;
    setBusy(true);
    setError('');
    try {
      const pageUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
      const r = await subscribe(page.slug, toInput(form, smsAddon, pageUrl, website), signedIn);
      saveSubscription(page.slug, { contact: r.contact, token: r.token, topics: form.topics, channels, childName: form.who === 'child' ? form.childName.trim() : '' });
      onCount(r.subscribers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not subscribe. Try again.');
    } finally {
      setBusy(false);
    }
  };

  /** Ends it (true when done): the page forgets it and the count goes down. */
  const leave = async () => {
    if (!saved) return true;
    setBusy(true);
    setError('');
    try {
      onCount((await unsubscribe(page.slug, saved.contact, saved.token)).subscribers);
      forgetSubscription(page.slug);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unsubscribe. Try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Signed out, nothing is known (and nothing may be revealed) about CLP opt-ins.
  const clpAlready = signedIn ? channels.filter((ch) => clpOn[ch]) : [];
  return { form, change, setWho, channels, clpAlready, missing: missingItem(form, smsAddon), saved, website, setWebsite, busy, error, submit, leave };
}
