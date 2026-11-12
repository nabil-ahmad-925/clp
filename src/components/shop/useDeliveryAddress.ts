'use client';

import { useCallback, useEffect, useState } from 'react';
import { PartnerApiError } from '@/content/partnerPages';
import { addressFromPlace, addressProblem, cleanAddress, myAddresses, saveAddress, type Address, type AddressBook } from '@/content/address';

export type DeliveryAddressState = ReturnType<typeof useDeliveryAddress>;

/**
 * A request's delivery address: a guest types it (started from the shop's "where it ships"); a signed-in client picks
 * one of their saved addresses or types a new one, saved to their account after the request goes when they ask.
 */
export function useDeliveryAddress(signedIn: boolean, place = '') {
  const [book, setBook] = useState<AddressBook | null>(null);
  const [choice, setChoice] = useState<string>('new');
  const [draft, setDraft] = useState<Address>(() => addressFromPlace(place));
  const [save, setSave] = useState(true);
  const [label, setLabel] = useState('');
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    myAddresses().then(
      (b) => {
        if (!live) return;
        setBook(b);
        if (b.addresses.length) setChoice((c) => (c === 'new' ? b.addresses[0].id : c));
      },
      () => live && setBook({ addresses: [], version: '' }),
    );
    return () => {
      live = false;
    };
  }, [signedIn]);
  // Signed out (or before their list loads): no saved addresses.
  const shown = signedIn ? book : null;
  const saved = shown?.addresses.find((x) => x.id === choice);
  const address: Address = saved ?? draft;
  const problem = saved ? '' : addressProblem(draft);

  /** The address to send, or null (and its problem shown) when it isn't complete. */
  const check = useCallback((): Address | null => {
    setTried(true);
    return problem ? null : cleanAddress(address);
  }, [problem, address]);

  /** After the request went: a new address they asked to keep goes on their account (never failing the request). */
  const keep = useCallback(async () => {
    if (!signedIn || saved || !save || !book) return;
    try {
      setBook(await saveAddress(book, draft, label));
    } catch (err) {
      // Changed on another device first: read them again and add it once more.
      if (err instanceof PartnerApiError && err.code === 'ADDRESSES_CHANGED') setBook(await saveAddress(await myAddresses(), draft, label).catch(() => book));
    }
  }, [signedIn, saved, save, book, draft, label]);

  return { signedIn, book: shown, choice, setChoice, draft, setDraft, save, setSave, label, setLabel, problem: tried ? problem : '', check, keep };
}
