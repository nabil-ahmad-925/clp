'use client';

import type { FormEvent } from 'react';
import type { PartnerPageData } from '@/content/partnerPages';
import c from '../contact/contact.module.css';
import ps from '../partnerPage.module.css';
import { CloseButton } from '../page/CloseButton';
import { Overlay } from '../page/Overlay';
import ConsentBoxes from './ConsentBoxes';
import ReachFields from './ReachFields';
import SubscribedView from './SubscribedView';
import TopicCards from './TopicCards';
import { useSubscribe } from './useSubscribe';
import WhoForCards from './WhoForCards';
import u from './subscribe.module.css';

type Props = {
  page: PartnerPageData;
  /** The partner has the CLP SMS add-on: Email and Text toggles (no partner has it yet). */
  smsAddon: boolean;
  onCount: (subscribers: number) => void;
  onClose: () => void;
};

/**
 * Subscribe (replaces Follow): what people want to hear about, how to reach them, and the consent that covers CLP as
 * the sender. The button stays grey, naming the first thing missing, until all of it is done. Subscribed, it shows the
 * confirmation (with Unsubscribe) instead.
 */
export default function SubscribeDialog({ page, smsAddon, onCount, onClose }: Props) {
  const s = useSubscribe(page, smsAddon, onCount);
  const send = (e: FormEvent) => {
    e.preventDefault();
    void s.submit();
  };
  const leave = async () => {
    if (await s.leave()) onClose();
  };
  return (
    <Overlay onClose={onClose} width={620} label={s.saved ? `Subscribed to ${page.short}` : `Subscribe to ${page.short}`}>
      <div className={c.head}>
        <div className={c.heading}>
          <h2 className={c.title}>{s.saved ? `Subscribed to ${page.short}` : `Subscribe to ${page.short}`}</h2>
          <span className={c.sub}>{s.saved ? 'Thanks for following along' : 'Pick what you want and how to get it'}</span>
        </div>
        <CloseButton onClose={onClose} />
      </div>
      {s.saved ? (
        <SubscribedView short={page.short} sub={s.saved} busy={s.busy} error={s.error} onDone={onClose} onUnsubscribe={() => void leave()} />
      ) : (
        <form className={c.body} onSubmit={send} noValidate>
          <WhoForCards who={s.form.who} onWho={s.setWho} />
          <TopicCards topics={s.form.topics} onTopics={(topics) => s.change({ topics })} />
          <ReachFields form={s.form} short={page.short} smsAddon={smsAddon} onChange={s.change} />
          <ConsentBoxes form={s.form} partnerName={page.name} short={page.short} channels={s.channels} clpAlready={s.clpAlready} onChange={s.change} />
          {/* A field people don't see: filled in, the request is a bot's. */}
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className={ps.trap} value={s.website} onChange={(e) => s.setWebsite(e.target.value)} />
          {s.error && <span className={c.error}>{s.error}</span>}
          <button type="submit" className={u.subscribe} disabled={Boolean(s.missing) || s.busy || page.preview}>
            {s.busy ? 'Subscribing…' : s.missing || 'Subscribe'}
          </button>
        </form>
      )}
    </Overlay>
  );
}
