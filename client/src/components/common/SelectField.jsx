import { forwardRef, useId } from 'react';
import styles from './TextField.module.css';

const SelectField = forwardRef(function SelectField({ label, error, id, children, ...rest }, ref) {
  const auto = useId();
  const fid = id || auto;
  return (
    <div className={styles.field}>
      <label htmlFor={fid} className={styles.label}>{label}</label>
      <div className={`${styles.control} ${error ? styles.invalid : ''}`}>
        <select ref={ref} id={fid} className={styles.input} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${fid}-err` : undefined} {...rest}>
          {children}
        </select>
      </div>
      {error && <p id={`${fid}-err`} role="alert" className={styles.error}>{error}</p>}
    </div>
  );
});
export default SelectField;
