import { cartChanged, getCart, joinAccountCart, switchCartId } from '@/content/cart';
import { forgetFavorites, joinFavorites, loadFavorites } from '@/components/shop/favoritesSync';

/**
 * What a guest keeps in this browser (their cart, their favorites) and the account they sign in to. Signing in joins
 * the guest's to the account's, and from then on the account's are used (on every device). Signing out leaves them
 * with the account and starts this browser afresh, so the next person here doesn't see them.
 *
 * "clp-account-owner" remembers whose this browser's cart and favorites are (a user id, '' for a guest): a page load
 * after signing in or out (here, in another tab, or a sign-in that ran out) finishes the switch.
 */
const OWNER = 'clp-account-owner';

const readOwner = () => {
  try {
    return localStorage.getItem(OWNER) ?? '';
  } catch {
    return '';
  }
};
const writeOwner = (id: string) => {
  try {
    if (id) localStorage.setItem(OWNER, id);
    else localStorage.removeItem(OWNER);
  } catch {
    // Storage blocked: checked again on the next page.
  }
};

/** Tells the cart badges about the cart now in use. */
const showCart = () => getCart().then(cartChanged, () => {});

function signedOut() {
  switchCartId();
  forgetFavorites();
  writeOwner('');
  void showCart();
}

async function signedIn(userId: string) {
  await Promise.all([joinAccountCart(), joinFavorites()]);
  writeOwner(userId);
  void showCart();
}

let running: Promise<void> | null = null;

/** Brings this browser in line with who's signed in (`userId`, '' for nobody). Failures are tried again on the next page. */
export function syncAccount(userId: string) {
  const step = async () => {
    const owner = readOwner();
    if (owner && owner !== userId) signedOut();
    if (!userId) return;
    if (owner === userId) await loadFavorites();
    else await signedIn(userId);
  };
  running = (running ?? Promise.resolve()).then(step).catch(() => {});
  return running;
}
