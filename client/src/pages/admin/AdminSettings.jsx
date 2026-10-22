import Panel from '../../components/admin/Panel';
import { useAuth } from '../../context/AuthContext';
import styles from '../../components/admin/admin.module.css';

export default function AdminSettings() {
  const { user } = useAuth();
  return (
    <div className={styles.grid2}>
      <Panel title="Your account" id="acct">
        <dl style={{ margin: 0, display: 'grid', gap: 12 }}>
          <div><dt className={styles.statHint}>Name</dt><dd style={{ margin: 0, fontWeight: 600 }}>{user.name}</dd></div>
          <div><dt className={styles.statHint}>Email</dt><dd style={{ margin: 0, fontWeight: 600, overflowWrap: 'anywhere' }}>{user.email}</dd></div>
          <div><dt className={styles.statHint}>Role</dt><dd style={{ margin: 0, fontWeight: 600 }}>Administrator</dd></div>
        </dl>
      </Panel>
      <Panel title="Security" id="sec">
        <p>Administrator sessions end when the browser session ends and last at most 8 hours. Credentials are managed on the server; there is no in-app password recovery.</p>
        <p className={styles.statHint} style={{ marginTop: 12 }}>Platform settings will arrive in a later phase.</p>
      </Panel>
    </div>
  );
}
