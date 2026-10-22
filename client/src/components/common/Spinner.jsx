import styles from './Spinner.module.css';
export default function Spinner({ label = 'Loading', inline = false, decorative = false }) {
  if (decorative) return <span className={`${styles.spinner} ${inline ? styles.inline : ''}`} aria-hidden="true" />;
  return <span className={`${styles.spinner} ${inline ? styles.inline : ''}`} role="status" aria-label={label} />;
}
