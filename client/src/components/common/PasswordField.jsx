import { forwardRef, useState } from 'react';
import TextField from './TextField';
import styles from './PasswordField.module.css';

const Eye = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

const PasswordField = forwardRef(function PasswordField(props, ref) {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      ref={ref}
      type={shown ? 'text' : 'password'}
      autoCapitalize="none"
      spellCheck={false}
      trailing={
        <button type="button" className={styles.toggle} onClick={() => setShown((s) => !s)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
          <Eye off={shown} />
        </button>
      }
      {...props}
    />
  );
});
export default PasswordField;
