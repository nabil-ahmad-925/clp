'use client';

import { useEffect, useState } from 'react';
import { fetchServicePlan, mayBeService, type ServicePlan } from '@/content/service';

/** A coach's service listing's plan: undefined while it's read, null when there's none (it books as usual, also if it can't be read). */
export function useServicePlan(widgetId: number, listingId: string, kind?: string) {
  const service = mayBeService(widgetId, kind);
  const [plan, setPlan] = useState<ServicePlan | null | undefined>(undefined);
  useEffect(() => {
    if (!service) return;
    let active = true;
    fetchServicePlan(String(widgetId), listingId).then(
      (p) => active && setPlan(p),
      () => active && setPlan(null),
    );
    return () => {
      active = false;
    };
  }, [service, widgetId, listingId]);
  return service ? plan : null;
}
