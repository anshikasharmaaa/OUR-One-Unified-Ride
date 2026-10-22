import { PASSWORD_RULES } from '../../utils/validators';
import styles from './PasswordRules.module.css';

export default function PasswordRules({ value = '' }) {
  return (
    <ul className={styles.list} aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li key={r.id} className={ok ? styles.ok : ''}>
            <span aria-hidden="true" className={styles.mark}>{ok ? '✓' : '•'}</span>
            {r.label}
            <span className="visually-hidden">{ok ? ' — met' : ' — not met'}</span>
          </li>
        );
      })}
    </ul>
  );
}
