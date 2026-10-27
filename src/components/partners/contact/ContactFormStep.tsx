'use client';

import FieldSelect from '@/components/ui/FieldSelect';
import type { PartnerPageData } from '@/content/partnerPages';
import ps from '../partnerPage.module.css';
import type { ContactDraft } from './contactDraft';
import { ctaOf, type ContactTopic } from './contactTopics';
import c from './contact.module.css';
import { useContactForm } from './useContactForm';

type Props = { page: PartnerPageData; topic: ContactTopic; signedIn: boolean; initial: ContactDraft | null; onBack: () => void; onSent: (path: string) => void };

/** Step 2: the topic's tag (Change Topic goes back), its help line and fields, the message, the rule box and the button. */
export default function ContactFormStep({ page, topic, signedIn, initial, onBack, onSent }: Props) {
  const f = useContactForm(page, topic, signedIn, initial, onSent);
  const set = (id: string) => (value: string) => f.setFields((x) => ({ ...x, [id]: value }));
  return (
    <form className={c.body} onSubmit={f.submit} noValidate>
      <div className={c.tagRow}>
        <span className={c.tag}>{topic.label}</span>
        <button type="button" className={c.change} onClick={onBack}>
          Change Topic
        </button>
      </div>
      <p className={c.help}>{topic.help}</p>
      {f.askSender && (
        <div className={c.pair}>
          <label className={c.field}>
            Your name
            <input maxLength={80} autoComplete="name" value={f.sender.name} onChange={(e) => f.setSender({ ...f.sender, name: e.target.value })} />
          </label>
          <label className={c.field}>
            Your email
            <input type="email" maxLength={200} autoComplete="email" value={f.sender.email} onChange={(e) => f.setSender({ ...f.sender, email: e.target.value })} />
          </label>
        </div>
      )}
      {topic.fields.map((field) =>
        field.kind === 'select' ? (
          <div key={field.id} className={c.field}>
            {field.label}
            <FieldSelect label={field.label} className={c.select} value={f.fields[field.id]} options={field.options} onChange={set(field.id)} />
          </div>
        ) : (
          <label key={field.id} className={c.field}>
            {field.label}
            <input maxLength={field.max} placeholder={field.placeholder} value={f.fields[field.id]} onChange={(e) => set(field.id)(e.target.value)} />
          </label>
        ),
      )}
      <label className={c.field}>
        Your message
        <textarea rows={5} maxLength={1800} placeholder={topic.placeholder} value={f.text} onChange={(e) => f.setText(e.target.value)} />
      </label>
      {/* A field people don't see: filled in, the request is a bot's. */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className={ps.trap} value={f.website} onChange={(e) => f.setWebsite(e.target.value)} />
      <div className={c.rule}>{topic.rule}</div>
      {f.error && <span className={c.error}>{f.error}</span>}
      <button type="submit" className={c.send} disabled={f.busy || page.preview}>
        {f.busy ? 'Sending…' : ctaOf(topic, signedIn)}
      </button>
    </form>
  );
}
