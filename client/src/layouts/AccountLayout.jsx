import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Logo from '../components/common/Logo';
import Icon from '../components/common/Icon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import styles from './AdminLayout.module.css';

const NAV = [
  { to: '/account', label: 'Dashboard', icon: 'home', end: true },
  { to: '/account/search', label: 'Search Rides', icon: 'search' },
  { to: '/account/history', label: 'My Searches', icon: 'clock' },
  { to: '/account/profile', label: 'My Profile', icon: 'user' },
];

export default function AccountLayout() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [busy, setBusy] = useState(false);
  const burgerRef = useRef(null);
  const sideRef = useRef(null);
  const title = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label || 'Account';

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    sideRef.current?.querySelector('a')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { setDrawer(false); burgerRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const logout = async () => {
    setBusy(true);
    await signOut();
    toast.success('You have been signed out.');
    navigate('/login', { replace: true });
  };

  return (
    <div className={`${styles.shell} ${drawer ? styles.drawerOpen : ''}`}>
      <Helmet><title>{`${title} · OUR`}</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <a href="#account-main" className="skip-link">Skip to main content</a>

      <aside id="account-sidebar" ref={sideRef} className={styles.sidebar} aria-label="Account navigation">
        <div className={styles.brand}>
          <Link to="/account" aria-label="OUR account"><Logo size="md" className={styles.logo} /></Link>
          <button type="button" className={styles.closeBtn} onClick={() => setDrawer(false)} aria-label="Close navigation"><Icon name="close" /></button>
        </div>
        <nav className={styles.nav}>
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                  <Icon name={n.icon} /><span className={styles.label}>{n.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <button type="button" className={`${styles.link} ${styles.logout}`} onClick={logout} disabled={busy}>
          <Icon name="logout" /><span className={styles.label}>{busy ? 'Signing out…' : 'Log out'}</span>
        </button>
      </aside>
      {drawer && <button type="button" className={styles.scrim} aria-label="Close navigation" onClick={() => setDrawer(false)} />}

      <div className={styles.content}>
        <header className={styles.header}>
          <button ref={burgerRef} type="button" className={`${styles.iconBtn} ${styles.burger}`} onClick={() => setDrawer(true)} aria-label="Open navigation" aria-expanded={drawer} aria-controls="account-sidebar"><Icon name="menu" /></button>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.right}>
            <Link to="/" className={styles.site}>Public site <Icon name="external" size={16} /></Link>
            <div className={styles.profile}>
              <span className={styles.avatar} aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
              <span className={styles.who}><strong>{user.name}</strong><small>User</small></span>
            </div>
          </div>
        </header>
        <main id="account-main" tabIndex={-1} className={styles.main}><Outlet /></main>
      </div>
    </div>
  );
}
