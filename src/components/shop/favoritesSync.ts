import { getMyFavorites, saveMyFavorites, type WsFavorites } from '@/content/wholesale';
import { NO_FAVORITES, patchWholesale, readWholesale } from './wholesaleStore';

/**
 * Favorites and the account (clp-api /my/wholesale/favorites). A guest's stay in this browser. Signing in joins them
 * to the account's, and while signed in every change is saved to the account. Signing out starts this browser's
 * favorites again (the account keeps its own).
 */
const keyOf = (f: WsFavorites) => JSON.stringify([f.folders, f.favs]);
/** What the account has (as keyOf), '' until it's loaded: nothing is saved before that. */
let onAccount = '';

const here = (): WsFavorites => {
  const s = readWholesale();
  return { folders: s.folders, favs: s.favs };
};

/** Both together: every folder (by id), and every item in each folder either had it in. */
export function mergeFavorites(account: WsFavorites, guest: WsFavorites): WsFavorites {
  const folders = [...account.folders, ...guest.folders.filter((f) => !account.folders.some((a) => a.id === f.id))];
  const favs = { ...account.favs };
  for (const [id, inFolders] of Object.entries(guest.favs)) favs[id] = [...new Set([...(favs[id] ?? []), ...inFolders])];
  return { folders, favs };
}

/** Signing in: what was saved as a guest joins the account's favorites (here and on the account). */
export async function joinFavorites() {
  const account = await getMyFavorites();
  const merged = mergeFavorites(account, here());
  if (keyOf(merged) !== keyOf(account)) await saveMyFavorites(merged);
  onAccount = keyOf(merged);
  patchWholesale(merged);
}

/** Signed in already: the account's favorites (maybe changed on another device) replace this browser's copy. */
export async function loadFavorites() {
  const account = await getMyFavorites();
  if (!account.folders.length) {
    // Nothing on the account yet: this browser's are saved to it.
    onAccount = keyOf(account);
    return saveFavorites();
  }
  onAccount = keyOf(account);
  patchWholesale(account);
}

/** A change while signed in: saved to the account, unless it has it already (or isn't loaded yet). */
export async function saveFavorites() {
  const now = here();
  if (!onAccount || keyOf(now) === onAccount) return;
  const before = onAccount;
  onAccount = keyOf(now);
  await saveMyFavorites(now).catch(() => {
    onAccount = before;
  });
}

/** Signed out: this browser starts with no favorites. */
export function forgetFavorites() {
  onAccount = '';
  patchWholesale(NO_FAVORITES);
}
