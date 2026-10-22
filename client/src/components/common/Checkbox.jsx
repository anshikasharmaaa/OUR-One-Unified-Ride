import { forwardRef, useId } from 'react';
import styles from './Checkbox.module.css';

const Checkbox = forwardRef(function Checkbox({ label, id, ...rest }, ref) {
  const auto = useId();
  const fid = id || auto;
  return (
    <label htmlFor={fid} className={styles.wrap}>
      <input ref={ref} id={fid} type="checkbox" className={styles.box} {...rest} />
      <span>{label}</span>
    </label>
  );
});
export default Checkbox;
