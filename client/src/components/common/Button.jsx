import Spinner from './Spinner';
import styles from './Button.module.css';

export default function Button({ variant = 'primary', loading = false, fullWidth = false, size = 'md', disabled, children, className = '', type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.full : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner inline decorative />}
      <span>{children}</span>
    </button>
  );
}
