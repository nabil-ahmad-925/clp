'use client';

import { useEffect } from 'react';

type Look = Record<string, string>;
type Props = {
  look: Look;
  /** The page's look (the admin's): the code drawn large and spaced. */
  large?: boolean;
  code: string;
  onCode: (code: string) => void;
  /** Seconds until a new code may be asked for. */
  wait: number;
  onResend: () => void;
  backLabel: string;
  onBack: () => void;
};

/** The e-mail code step: only the 6-digit code, "Send a New Code" (after a short wait) and the way back. */
export default function CodeStep({ look, large, code, onCode, wait, onResend, backLabel, onBack }: Props) {
  return (
    <div className={look.fields} style={large ? undefined : { gridTemplateColumns: '1fr' }}>
      <label className={look.field}>
        6-digit code
        <input
          className={`${look.input} ${large ? look.code : ''}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          placeholder={large ? '000000' : undefined}
          value={code}
          onChange={(e) => onCode(e.target.value)}
        />
      </label>
      <button type="button" className={look.link} onClick={onResend} disabled={wait > 0}>
        {wait > 0 ? `Send a New Code in ${wait}s` : 'Send a New Code'}
      </button>
      <button type="button" className={look.link} onClick={onBack}>
        {backLabel}
      </button>
    </div>
  );
}

/** Tells the page while a form is on its code step (the page then shows only the form), and that it left it. */
export function useCodeStep(on: boolean, onCodeStep?: (on: boolean) => void) {
  useEffect(() => {
    onCodeStep?.(on);
  }, [on, onCodeStep]);
  useEffect(() => () => onCodeStep?.(false), [onCodeStep]);
}
