'use client';

import { useState, type FormEvent } from 'react';
import buttonStyles from '@/components/ui/Button.module.css';
import { COUNTRIES, flag } from '@/content/countries';
import type { EnquiryField, EnquiryItem } from '@/content/types';
import styles from './EnquiryForm.module.css';

type Props = { formId: string; submit: string; items: EnquiryItem[] };
type Values = Record<string, string | string[]>;

const REQUIRED = 'This field is required.';
const BAD_EMAIL = 'Please enter a valid email address.';

/**
 * Enquiry form (WPForms on the original): two-column rows of fields, message, consent boxes and Submit.
 * Required fields are checked on submit with the plugin's messages.
 */
export default function EnquiryForm({ formId, submit, items }: Props) {
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [country, setCountry] = useState('US');
  const [notice, setNotice] = useState('');

  const fields = items.flatMap((it) => ('kind' in it ? it.columns.flatMap((c) => c.fields) : [it]));
  const set = (key: string, value: string | string[]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.id];
      const empty = Array.isArray(v) ? v.length === 0 : !String(v ?? '').trim();
      if (f.required && empty) next[f.id] = REQUIRED;
      else if (f.type === 'email' && !empty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) next[f.id] = BAD_EMAIL;
    }
    setErrors(next);
    if (Object.values(next).some(Boolean)) return setNotice('');
    // Enquiries are received by the original site's form system, which this rebuild doesn't run.
    setNotice('Sorry, this form can’t be sent at the moment. Please try again later.');
  };

  const field = (f: EnquiryField) => {
    const id = `wpforms-${formId}-field_${f.id}`;
    const err = errors[f.id];
    const label = (
      <>
        {f.label}
        {f.required && <span className={styles.required}> *</span>}
      </>
    );
    const errorText = err && (
      <em id={`${id}-error`} className={styles.error} role="alert">
        {err}
      </em>
    );
    const invalid = err ? styles.invalid : '';

    switch (f.type) {
      case 'address':
      case 'checkbox':
        return (
          <div key={f.id} className={styles.field} role="group" aria-labelledby={`${id}-label`}>
            <div id={`${id}-label`} className={styles.label}>
              {label}
            </div>
            {f.type === 'address' ? (
              <>
                {(f.parts ?? []).map((part, i) => {
                  const key = `${f.id}.${i}`;
                  const control = part.options ? (
                    <select className={styles.input} value={String(values[key] ?? '')} onChange={(e) => set(key, e.target.value)} aria-label={part.label}>
                      {part.options.map((o) => (
                        <option key={o.value} value={o.value} disabled={!o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input className={styles.input} type="text" value={String(values[key] ?? '')} onChange={(e) => set(key, e.target.value)} aria-label={part.label} />
                  );
                  return (
                    <div key={key} className={i === 0 ? styles.addressRow : styles.addressBlock}>
                      {control}
                      <span className={styles.sublabel}>{part.label}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <ul className={styles.choices}>
                {(f.choices ?? []).map((choice, i) => {
                  const checked = ((values[f.id] as string[]) ?? []).includes(choice);
                  return (
                    <li key={i}>
                      <input
                        id={`${id}_${i + 1}`}
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const list = (values[f.id] as string[]) ?? [];
                          set(f.id, checked ? list.filter((c) => c !== choice) : [...list, choice]);
                        }}
                      />
                      <label htmlFor={`${id}_${i + 1}`} className={styles.inline} dangerouslySetInnerHTML={{ __html: choice }} />
                    </li>
                  );
                })}
              </ul>
            )}
            {errorText}
          </div>
        );
      default:
        return (
          <div key={f.id} className={styles.field}>
            <label className={styles.label} htmlFor={id}>
              {label}
            </label>
            {f.type === 'select' ? (
              <select id={id} className={`${styles.input} ${invalid}`} value={String(values[f.id] ?? f.selected ?? f.options?.[0]?.value ?? '')} onChange={(e) => set(f.id, e.target.value)}>
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value} disabled={o.placeholder}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea id={id} className={`${styles.input} ${styles.textarea} ${invalid}`} value={String(values[f.id] ?? '')} onChange={(e) => set(f.id, e.target.value)} aria-invalid={!!err} />
            ) : f.type === 'phone' ? (
              <div className={styles.phone}>
                <label className={styles.country}>
                  <span aria-hidden>{flag(country)}</span>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country code">
                    {COUNTRIES.map(([code, name, dial]) => (
                      <option key={code} value={code}>
                        {name} (+{dial})
                      </option>
                    ))}
                  </select>
                </label>
                <input id={id} type="tel" className={`${styles.input} ${styles.phoneInput} ${invalid}`} placeholder="(201) 555-0123" value={String(values[f.id] ?? '')} onChange={(e) => set(f.id, e.target.value)} />
              </div>
            ) : (
              <input
                id={id}
                type={f.type === 'email' ? 'email' : 'text'}
                className={`${styles.input} ${invalid}`}
                placeholder={f.placeholder}
                value={String(values[f.id] ?? '')}
                onChange={(e) => set(f.id, e.target.value)}
                aria-invalid={!!err}
              />
            )}
            {errorText}
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {items.map((it, i) =>
          'kind' in it ? (
            <div key={i} className={styles.row}>
              {it.columns.map((col, j) => (
                <div key={j} className={styles.column} style={{ width: `${col.width}%` }}>
                  {col.fields.map(field)}
                </div>
              ))}
            </div>
          ) : (
            field(it)
          ),
        )}
        {notice && <div className={styles.notice}>{notice}</div>}
        <div className={styles.submitWrap}>
          <button type="submit" className={`${buttonStyles.button} ${buttonStyles.dark} ${styles.submit}`}>
            <span>{submit}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
