import { call } from './partnerPages';
import { partnerCall } from './partnerSession';

/**
 * Subscribe on a partner's page (clp-api subscriptions): the topics, how to reach them and the consent boxes ticked.
 * The API keeps one consent record per box with its own wording; `contact` and `token` come back for Unsubscribe.
 */
export type SubscribeInput = {
  who: 'self' | 'child';
  childName: string;
  topics: string[];
  firstName: string;
  lastName: string;
  channels: ('email' | 'sms')[];
  email: string;
  phone: string;
  agree: { age: boolean; email?: boolean; sms?: boolean };
  clp: boolean;
  pageUrl: string;
  website?: string;
};
export type Subscribed = { subscribed: true; subscribers: number; contact: string; token: string };

const path = (slug: string) => `/subscriptions/${encodeURIComponent(slug)}`;

/** Signed in, the CLP consent is kept with the account too. */
export const subscribe = (slug: string, input: SubscribeInput, signedIn: boolean) =>
  signedIn
    ? partnerCall<Subscribed>(`/my${path(slug)}`, { method: 'POST', body: JSON.stringify(input) })
    : call<Subscribed>(path(slug), { method: 'POST', body: JSON.stringify(input) });

export const unsubscribe = (slug: string, contact: string, token: string) =>
  call<{ subscribed: false; subscribers: number }>(`${path(slug)}/unsubscribe`, { method: 'POST', body: JSON.stringify({ contact, token }) });

/** The channels the signed-in member already gets CLP's own updates on. */
export const clpOptIns = () => partnerCall<{ email: boolean; sms: boolean }>('/my/subscriptions/clp');
