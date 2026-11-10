import { EXPECTATIONS_VERSION } from './expectations';
import type { Audience } from './expectationsRoles';
import { PartnerApiError } from './partnerPages';
import { partnerCall, partnerUser } from './partnerSession';

/**
 * "I agree" on /our-expectations/: { version, role, agreedAt }. A signed-in account keeps it on its user record
 * (clp-api PATCH /me agreeExpectations, `expectations` on GET /me); a guest keeps it in this browser until they sign in,
 * when syncAccount moves it to the account (joinAgreement) and clears the browser's copy. Only an agreement to the
 * current version counts: a new version asks everyone again.
 */
export type Agreement = { version: string; role: Audience; agreedAt: string };

const KEY = 'clp-expectations-agreement';
const EVENT = 'clp-expectations-agreement';

const isAgreement = (a: unknown): a is Agreement => {
  const x = a as Agreement | null;
  return Boolean(x && typeof x.version === 'string' && typeof x.agreedAt === 'string' && ['player', 'parent', 'partner'].includes(x.role));
};
const current = (a: unknown) => (isAgreement(a) && a.version === EXPECTATIONS_VERSION ? a : null);

/** The stored agreement as text (a stable snapshot for useSyncExternalStore; '' when none or storage is blocked). */
export const agreementSnapshot = () => {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
};
/** The agreement in a snapshot, when it is to the current version. */
export const agreementFromSnapshot = (raw: string): Agreement | null => {
  try {
    return current(JSON.parse(raw || 'null'));
  } catch {
    return null;
  }
};
/** The guest's agreement in this browser (null when none, an old version, or storage is blocked). */
export const browserAgreement = () => agreementFromSnapshot(agreementSnapshot());

/** Calls `fn` when this browser's agreement changes (here or in another tab); returns the unsubscribe. */
export function onAgreementChange(fn: () => void) {
  const storage = (e: StorageEvent) => e.key === KEY && fn();
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('storage', storage);
  };
}

function writeBrowser(a: Agreement | null) {
  try {
    if (a) localStorage.setItem(KEY, JSON.stringify(a));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the agreement lasts for this page only.
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

type MeAnswer = { user: { expectations?: unknown } };

/** The signed-in account's agreement to the current version, or null. */
export const accountAgreement = () => partnerCall<MeAnswer>('/me').then((r) => current(r.user.expectations));

const agreeOnAccount = (role: Audience) =>
  partnerCall<MeAnswer>('/me', { method: 'PATCH', body: JSON.stringify({ agreeExpectations: { version: EXPECTATIONS_VERSION, role } }) }).then((r) =>
    current(r.user.expectations),
  );

/** Records "I agree": on the account when signed in, otherwise in this browser. */
export async function agree(role: Audience): Promise<Agreement> {
  if (partnerUser()) {
    const saved = await agreeOnAccount(role);
    if (!saved) throw new Error('The agreement wasn’t saved. Try again.');
    return saved;
  }
  const a: Agreement = { version: EXPECTATIONS_VERSION, role, agreedAt: new Date().toISOString() };
  writeBrowser(a);
  return a;
}

/**
 * Signing in: the guest's agreement goes to the account, then leaves the browser. One the account can't take (a member
 * who agreed as a partner) is dropped. Never throws: a failure only means the page asks them again.
 */
export async function joinAgreement() {
  const a = browserAgreement();
  if (!a) return;
  try {
    await agreeOnAccount(a.role);
    writeBrowser(null);
  } catch (err) {
    if (err instanceof PartnerApiError && err.status >= 400 && err.status < 500) writeBrowser(null);
  }
}

/** Signing out: the next person here hasn't agreed. */
export const forgetAgreement = () => writeBrowser(null);
