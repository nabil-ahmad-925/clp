'use client';

import s from '../partnerPage.module.css';
import { useSavedSubscription } from './subscriptionStore';
import u from './subscribe.module.css';

/** The header's Subscribe; once subscribed here, "✓ Subscribed" (black) reopening the confirmation. */
export default function SubscribeButton({ slug, onOpen }: { slug: string; onOpen: () => void }) {
  const saved = useSavedSubscription(slug);
  return (
    <button type="button" className={`${s.action} ${saved ? u.subscribedAction : s.actionOutline}`} onClick={onOpen}>
      {saved ? '✓ Subscribed' : 'Subscribe'}
    </button>
  );
}
