import styles from './Alert.module.css';
export default function Alert({ variant = 'info', children }) {
  return <div className={`${styles.alert} ${styles[variant]}`} role={variant === 'error' ? 'alert' : 'status'}>{children}</div>;
}
