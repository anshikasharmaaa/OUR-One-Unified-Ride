import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Logo from '../components/common/Logo';
import Icon from '../components/common/Icon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminApi } from '../services/adminApi';
import styles from './AdminLayout.module.css';

const NAV = [
  { to: '/admin', label: 'Overview', icon: 'home', end: true },
  { to: '/admin/contacts', label: 'Contact Queries', icon: 'mail', badge: true },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/providers', label: 'Providers', icon: 'car' },
  { to: '/admin/searches', label: 'Ride Searches', icon: 'search' },
  { to: '/admin/comparisons', label: 'Comparison Activity', icon: 'activity' },
  { to: '/admin/analytics', label: 'Analytics & Reports', icon: 'chart' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
];
const KEY = 'our.admin.sidebarCollapsed';
const readCollapsed = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawer, setDrawer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(0); // real count of new (unanswered) contact queries
  const burgerRef = useRef(null);
  const sideRef = useRef(null);
  const title = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label || 'Admin';

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    let alive = true;
    Promise.resolve(adminApi.contactCounts?.()).then((c) => { if (alive && c) setOpen(c.open || 0); }).catch(() => { });
    return () => { alive = false; };
  }, [pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    sideRef.current?.querySelector('a')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { setDrawer(false); burgerRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const toggleCollapsed = () => setCollapsed((c) => {
    try { localStorage.setItem(KEY, c ? '0' : '1'); } catch { /* preference only */ }
    return !c;
  });
  const logout = async () => {
    setBusy(true);
    await signOut();
    toast.success('You have been signed out.');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''} ${drawer ? styles.drawerOpen : ''}`}>
      <Helmet><title>{`${title} · OUR Admin`}</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <a href="#admin-main" className="skip-link">Skip to main content</a>

      <aside id="admin-sidebar" ref={sideRef} className={styles.sidebar} aria-label="Admin navigation">
        <div className={styles.brand}>
          <Link to="/admin" aria-label="OUR admin overview" className={styles.logoTile}><Logo size="md" className={styles.logo} /></Link>
          <button type="button" className={styles.closeBtn} onClick={() => setDrawer(false)} aria-label="Close navigation"><Icon name="close" /></button>
        </div>
        <nav className={styles.nav}>
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} title={collapsed ? n.label : undefined}>
                  <Icon name={n.icon} /><span className={styles.label}>{n.label}</span>
                  {n.badge && open > 0 && <span className={styles.count} aria-label={`${open} new`}>{open > 99 ? '99+' : open}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <button type="button" className={`${styles.link} ${styles.logout}`} onClick={logout} disabled={busy} title={collapsed ? 'Log out' : undefined}>
          <Icon name="logout" /><span className={styles.label}>{busy ? 'Signing out…' : 'Log out'}</span>
        </button>
      </aside>
      {drawer && <button type="button" className={styles.scrim} aria-label="Close navigation" onClick={() => setDrawer(false)} />}

      <div className={styles.content}>
        <header className={styles.header}>
          <button ref={burgerRef} type="button" className={`${styles.iconBtn} ${styles.burger}`} onClick={() => setDrawer(true)} aria-label="Open navigation" aria-expanded={drawer} aria-controls="admin-sidebar"><Icon name="menu" /></button>
          <button type="button" className={`${styles.iconBtn} ${styles.collapse}`} onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={collapsed}><Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} /></button>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.right}>
            <Link to="/" className={styles.site}>View site <Icon name="external" size={16} /></Link>
            <Link to="/admin/contacts" className={styles.iconBtn} aria-label={open ? `Contact queries, ${open} new` : 'Contact queries'}>
              <Icon name="mail" />{open > 0 && <span className={styles.bellDot}>{open > 99 ? '99+' : open}</span>}
            </Link>
            <div className={styles.profile}>
              <span className={styles.avatar} aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
              <span className={styles.who}><strong>{user.name}</strong><small>Administrator</small></span>
            </div>
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className={styles.main}><Outlet /></main>
      </div>
    </div>
  );
}