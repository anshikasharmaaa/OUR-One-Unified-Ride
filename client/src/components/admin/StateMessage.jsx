import Button from '../common/Button';
import styles from './admin.module.css';

export default function StateMessage({ kind = 'empty', title, children, onRetry }) {
  return (
    <div className={`${styles.state} ${kind === 'error' ? styles.stateError : ''}`} role={kind === 'error' ? 'alert' : 'status'}>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
