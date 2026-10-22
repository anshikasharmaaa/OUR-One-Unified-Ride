import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import styles from './AppShell.module.css';

const ROLE_LABEL = { USER: 'User', ADMIN: 'Administrator', DRIVER: 'Driver' };

export default function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    const loginPath = user.role === 'DRIVER' ? '/driver/login' : user.role === 'ADMIN' ? '/admin/login' : '/login';
    await signOut();
    toast.success('You have been signed out.');
    navigate(loginPath, { replace: true });
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main">
          <Logo size="sm" />
          <span className={styles.role}>{ROLE_LABEL[user.role]}</span>
          <span className={styles.spacer} />
          <span className={styles.name} title={user.email}>{user.name}</span>
          <Button variant="secondary" size="sm" onClick={logout} loading={busy}>Log out</Button>
        </nav>
      </header>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}
