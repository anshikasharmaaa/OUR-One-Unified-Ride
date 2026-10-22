import { useRef } from 'react';
import styles from './OtpInput.module.css';

const LENGTH = 6;

/** Six single-digit boxes with paste, autofill (one-time-code), backspace and arrow-key support. */
export default function OtpInput({ value, onChange, disabled = false, invalid = false, autoFocus = true }) {
  const refs = useRef([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] || '');
  const focusAt = (i) => refs.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();

  const setFrom = (index, raw) => {
    const incoming = raw.replace(/\D/g, '');
    if (!incoming) return;
    const next = (value.slice(0, index) + incoming).slice(0, LENGTH);
    onChange(next);
    focusAt(Math.min(index + incoming.length, LENGTH - 1));
  };

  const onKeyDown = (e, i) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) onChange(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) { onChange(value.slice(0, i - 1) + value.slice(i)); focusAt(i - 1); }
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focusAt(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focusAt(i + 1); }
  };

  const onPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, LENGTH);
    if (!text) return;
    onChange(text);
    focusAt(text.length >= LENGTH ? LENGTH - 1 : text.length);
  };

  return (
    <div className={styles.group} role="group" aria-label="6-digit verification code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`${styles.box} ${invalid ? styles.invalid : ''}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && i === 0}
          maxLength={LENGTH}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${LENGTH}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => setFrom(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
