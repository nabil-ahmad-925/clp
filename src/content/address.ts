import { partnerCall } from './partnerSession';

/**
 * A US delivery address (Wholesale requests' "Deliver to"; clp-api shared/address.mjs has the same rules) and the ones a
 * signed-in client keeps on their account (GET /me, PATCH /me { addresses, addressesVersion }).
 */
export type Address = { line1: string; line2: string; city: string; state: string; postalCode: string; country?: 'US' };
export type SavedAddress = Address & { id: string; label: string };
export type AddressBook = { addresses: SavedAddress[]; version: string };

export const US_STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['PR', 'Puerto Rico'],
  ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'],
  ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];
export const EMPTY_ADDRESS: Address = { line1: '', line2: '', city: '', state: '', postalCode: '' };

/** What's missing or wrong, in the API's words ('' when it's complete). */
export function addressProblem(a: Address) {
  if (!a.line1.trim()) return 'Enter the street address.';
  if (!a.city.trim()) return 'Enter the city.';
  if (!US_STATES.some(([c]) => c === a.state)) return 'Choose the state.';
  if (!/^\d{5}(-\d{4})?$/.test(a.postalCode.trim())) return 'Enter a 5-digit ZIP code.';
  return '';
}
/** The address as the API takes it (trimmed). */
export const cleanAddress = (a: Address): Address => ({ line1: a.line1.trim(), line2: a.line2.trim(), city: a.city.trim(), state: a.state, postalCode: a.postalCode.trim(), country: 'US' });
/** An address on one line. */
export const formatAddress = (a: Address) => [a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`].filter(Boolean).join(', ');
const same = (a: Address, b: Address) => formatAddress(cleanAddress(a)).toLowerCase() === formatAddress(cleanAddress(b)).toLowerCase();

/** A start from the shop's "where it ships" (a ZIP, or "City, ST"). */
export function addressFromPlace(place: string): Address {
  const p = place.trim();
  const zip = /\b(\d{5})(?:-\d{4})?\b/.exec(p)?.[1] ?? '';
  const cityState = /^([^,\d]+),\s*([A-Za-z]{2})\b/.exec(p);
  const state = cityState && US_STATES.some(([c]) => c === cityState[2].toUpperCase()) ? cityState[2].toUpperCase() : '';
  return { ...EMPTY_ADDRESS, postalCode: zip, city: cityState ? cityState[1].trim() : '', state };
}

/** The signed-in client's saved addresses. */
export async function myAddresses(): Promise<AddressBook> {
  const r = await partnerCall<{ user: { addresses?: SavedAddress[]; addressesVersion?: string } }>('/me');
  return { addresses: r.user.addresses ?? [], version: r.user.addressesVersion ?? '' };
}

/** Saves a new address to their account (nothing when it's there already). */
export async function saveAddress(book: AddressBook, address: Address, label: string): Promise<AddressBook> {
  if (book.addresses.some((x) => same(x, address))) return book;
  const addresses = [...book.addresses, { ...cleanAddress(address), label: label.trim(), id: '' }].map(({ id, ...x }) => (id ? { id, ...x } : x));
  const r = await partnerCall<{ user: { addresses: SavedAddress[]; addressesVersion: string } }>('/me', { method: 'PATCH', body: JSON.stringify({ addresses, addressesVersion: book.version }) });
  return { addresses: r.user.addresses, version: r.user.addressesVersion };
}
