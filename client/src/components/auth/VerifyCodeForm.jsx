import { useEffect, useRef, useState } from 'react';
import OtpInput from './OtpInput';
import Button from '../common/Button';
import Alert from '../common/Alert';
import useCountdown, { formatClock } from '../../hooks/useCountdown';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../utils/errors';
import styles from './authForm.module.css';
import local from './VerifyCodeForm.module.css';

const EXPIRY_MS = 10 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;

/**
 * Shared "enter the 6-digit code" form.
 * onVerify(code) must throw on failure. onResend() asks the server for a new code.
 */
export default function VerifyCodeForm({ email, sentAt, autoResend = false, onVerify, onResend, onSent, submitLabel = 'Verify', changeEmail }) {
  const toast = useToast();
  const [sent, setSent] = useState(sentAt || null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const expiresIn = useCountdown(sent ? sent + EXPIRY_MS : 0);
  const cooldown = useCountdown(sent ? sent + COOLDOWN_MS : 0);
  const autoDone = useRef(false);

  const resend = async (quiet = false) => {
    setError('');
    setResending(true);
    try {
      await onResend();
      const ts = Date.now();
      setSent(ts);
      onSent?.(ts);
      setCode('');
      setResetKey((k) => k + 1);
      if (!quiet) toast.info('If the address is eligible, a new code is on its way.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (autoResend && !autoDone.current) {
      autoDone.current = true;
      resend(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (code.length < 6) { setError('Enter the 6-digit code.'); return; }
    setError('');
    setBusy(true);
    try {
      await onVerify(code);
    } catch (err) {
      setError(apiErrorMessage(err));
      setCode('');
      setResetKey((k) => k + 1);
      setBusy(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <p className={styles.muted}>
        We sent a 6-digit code to <strong className={local.email}>{email}</strong>.{' '}
        {changeEmail}
      </p>
      {error && <Alert variant="error">{error}</Alert>}
      <OtpInput key={resetKey} value={code} onChange={(v) => { setCode(v); if (error) setError(''); }} disabled={busy} invalid={Boolean(error)} />
      {sent ? (
        <p className={`${styles.muted} ${styles.small}`} role="timer" aria-live="off">
          {expiresIn > 0 ? `Code expires in ${formatClock(expiresIn)}` : 'This code has expired. Send a new one below.'}
        </p>
      ) : null}
      <Button type="submit" fullWidth loading={busy}>{submitLabel}</Button>
      <div className={local.resend}>
        <span className={styles.muted}>Didn’t get it?</span>
        <Button variant="ghost" size="sm" onClick={() => resend(false)} disabled={cooldown > 0 || busy} loading={resending}>
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </Button>
      </div>
    </form>
  );
}
