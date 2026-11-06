'use client';

import { useEffect, useState } from 'react';
import { fetchTripPlan, isTrip, type TripPlan } from '@/content/trip';

/** A trip listing's plan: undefined while it's read, null when there's none (it books as usual, also if it can't be read). */
export function useTripPlan(widgetId: number, listingId: string, kind?: string) {
  const trip = isTrip(widgetId, kind);
  const [plan, setPlan] = useState<TripPlan | null | undefined>(undefined);
  useEffect(() => {
    if (!trip) return;
    let active = true;
    fetchTripPlan(String(widgetId), listingId).then(
      (p) => active && setPlan(p),
      () => active && setPlan(null),
    );
    return () => {
      active = false;
    };
  }, [trip, widgetId, listingId]);
  return trip ? plan : null;
}
