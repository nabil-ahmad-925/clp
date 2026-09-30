'use client';

import { Fragment, useRef, useState, type FormEvent } from 'react';
import type { ContactField } from '@/content/types';
import styles from './ContactForm.module.css';

type Props = { formId: string; submit: string; paragraphs: ContactField[][] };
type Status = 'init' | 'invalid' | 'failed';

const REQUIRED = 'Please fill out this field.';
const BAD_EMAIL = 'Please enter an email address.';
const INVALID = 'One or more fields have an error. Please check and try again.';
// The plugin's message when the mail can't be sent; this rebuild has no mail server behind the form.
const FAILED = 'There was an error trying to send your message. Please try again later.';

/**
 * Inquiry form (Contact Form 7 on the original): labelled fields in paragraphs inside a white card, and a centred
 * gold Submit. As in the plugin, the whole form is checked once a field changes and again on submit, with the error
 * tip under each field and the result in a gold bar below the card.
 */
export default function ContactForm({ formId, submit, paragraphs }: Props) {
  const fields = paragraphs.flat();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.type === 'select' ? (f.options?.[0] ?? '') : ''])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('init');
  // Value of the focused field when it gained focus: a field that leaves focus changed triggers a check.
  const focusValue = useRef('');

  const validate = (v: Record<string, string>) => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const value = v[f.name].trim();
      if (!value) next[f.name] = REQUIRED;
      else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) next[f.name] = BAD_EMAIL;
    }
    setErrors(next);
    return next;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStatus(Object.keys(validate(values)).length ? 'invalid' : 'failed');
  };

  const unit = `wpcf7-f${formId}-o1`;
  const control = (f: ContactField) => {
    const invalid = !!errors[f.name];
    const common = {
      name: f.name,
      className: f.type === 'select' ? styles.select : styles.input,
      'aria-required': true,
      'aria-invalid': invalid,
      'aria-describedby': invalid ? `${unit}-ve-${f.name}` : undefined,
      value: values[f.name],
      onChange: (e: { target: { value: string } }) => {
        const next = { ...values, [f.name]: e.target.value };
        setValues(next);
        if (f.type === 'select') validate(next);
      },
      onFocus: () => (focusValue.current = values[f.name]),
      onBlur: () => {
        if (values[f.name] !== focusValue.current) validate(values);
      },
    };
    return f.type === 'select' ? (
      <select {...common}>
        {f.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    ) : (
      <input {...common} type={f.type} size={40} maxLength={400} autoComplete={f.autocomplete} />
    );
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={onSubmit} noValidate aria-label="Contact form" data-status={status}>
        <div className={styles.outer}>
          {paragraphs.map((group, i) => (
            <p key={i} className={styles.paragraph}>
              {group.map((f, j) => (
                <Fragment key={f.name}>
                  {j > 0 && <br />}
                  <label className={styles.label}>
                    {f.label}
                    <br />
                    <span className={styles.wrap}>
                      {control(f)}
                      {errors[f.name] && (
                        <span id={`${unit}-ve-${f.name}`} className={styles.tip}>
                          {errors[f.name]}
                        </span>
                      )}
                    </span>
                  </label>
                </Fragment>
              ))}
            </p>
          ))}
          <p className={styles.submitRow}>
            <input className={styles.submit} type="submit" value={submit} />
            <span className={styles.spinner} />
          </p>
        </div>
        {status !== 'init' && (
          <div className={styles.response} role="status">
            {status === 'invalid' ? INVALID : FAILED}
          </div>
        )}
      </form>
    </div>
  );
}
