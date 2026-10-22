import { forwardRef, useId } from 'react';
import styles from './TextField.module.css';

const TextField = forwardRef(function TextField({ label, error, hint, id, trailing, prefix, className = '', ...rest }, ref) {
  const auto = useId();
  const fid = id || auto;
  const describedBy = error ? `${fid}-err` : hint ? `${fid}-hint` : undefined;
  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={fid} className={styles.label}>{label}</label>
      <div className={`${styles.control} ${error ? styles.invalid : ''}`}>
        {prefix && <span className={styles.prefix} aria-hidden="true">{prefix}</span>}
        <input ref={ref} id={fid} className={styles.input} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...rest} />
        {trailing}
      </div>
      {error ? <p id={`${fid}-err`} role="alert" className={styles.error}>{error}</p> : hint ? <p id={`${fid}-hint`} className={styles.hint}>{hint}</p> : null}
    </div>
  );
});
export default TextField;
