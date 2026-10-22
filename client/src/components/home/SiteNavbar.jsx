import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';
import Icon from '../common/Icon';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useAvatarUrl from '../../hooks/useAvatarUrl';
import { dashboardFor } from '../../routes/paths';
import { scrollToId } from '../../hooks/useScrollToHash';
import { AVATAR_GRADIENT } from '../../utils/profileOptions';
import styles from './SiteNavbar.module.css';

// "Ride" is dropped from the bar to keep it compact (the section is still on the home page).
export const NAV = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Explore', to: '/explore' },
  { label: 'Upcoming', to: '/upcoming' },
  { label: 'Contact', to: '/contact' },
  { label: 'OUR’S', to: '/ours', special: true },
];

const ACCOUNT_LABEL = { USER: 'My profile', ADMIN: 'Admin dashboard' };

export default function SiteNavbar() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const { status, user, signOut } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false); // mobile drawer
  const [menu, setMenu] = useState(false); // account dropdown
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef(null);
  const closeRef = useRef(null);
  const menuRef = useRef(null);

  const authed = status === 'authenticated';
  // Only riders have a photo; for anyone else (or signed out) nothing is requested.
  const photo = useAvatarUrl(authed && user.role === 'USER' ? user.avatarVersion : 0);

  useEffect(() => { setOpen(false); setMenu(false); }, [pathname, hash]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Drawer: lock page scroll, Escape closes, focus moves into the drawer.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open]);

  // Rotating to a wide screen must never leave the page scroll-locked behind a hidden drawer.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const onChange = (e) => { if (e.matches) setOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menu]);

  const isActive = (item) => (item.hash ? pathname === '/' && hash === `#${item.hash}` : pathname === item.to && (item.to !== '/' || !hash));
  const go = (e, item) => {
    setOpen(false);
    if (item.hash && pathname === '/') {
      e.preventDefault();
      navigate({ pathname: '/', hash: `#${item.hash}` });
      scrollToId(item.hash); // also works when the hash is already the current one
    }
  };

  const logout = async () => {
    setBusy(true);
    setOpen(false);
    setMenu(false);
    await signOut();
    toast.success('You have been signed out.');
    setBusy(false);
  };
  // Normal users get a simple profile page; admins keep their dashboard.
  const accountPath = authed ? (user.role === 'USER' ? '/profile' : dashboardFor(user.role)) : '/login';
  const accountLabel = authed ? ACCOUNT_LABEL[user.role] || 'My account' : 'Log in';
  const first = authed ? user.name?.trim().split(/\s+/)[0] || 'Account' : '';

  const avatar = authed && (
    <span
      className={styles.avatar} aria-hidden="true"
      style={photo ? { overflow: 'hidden' } : { background: AVATAR_GRADIENT[user.avatarColor] || AVATAR_GRADIENT.blue }}
    >
      {photo
        ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : first.charAt(0).toUpperCase()}
    </span>
  );

  const links = (mobile) => NAV.map((item) => (
    <li key={item.label}>
      <Link
        to={item.hash ? { pathname: item.to, hash: `#${item.hash}` } : item.to}
        onClick={(e) => go(e, item)}
        aria-current={isActive(item) ? 'page' : undefined}
        className={[isActive(item) ? styles.active : '', item.special ? styles.special : ''].join(' ').trim()}
      >
        <span className={styles.linkLabel}>
          {item.label}
        </span>
        {mobile && <Icon name="chevronRight" size={18} />}
      </Link>
    </li>
  ));

  return (
    <>
      <header className={`${styles.header} ${scrolled || open ? styles.solid : ''}`}>
        <div className={`container ${styles.bar}`}>
          <Link to="/" className={styles.brand} aria-label="OUR — One Unified Ride, home"><Logo size="sm" className={styles.logo} /></Link>

          <nav className={styles.desktop} aria-label="Primary"><ul>{links(false)}</ul></nav>

          <div className={styles.actions}>
            <span className={styles.accountSlot}>
              {authed ? (
                <div className={styles.account} ref={menuRef}>
                  <button type="button" className={styles.user} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                    {avatar}
                    <span className={styles.userName}>{first}</span>
                    <Icon name="chevronDown" size={16} />
                  </button>
                  {menu && (
                    <div className={styles.dropdown} role="menu">
                      <p className={styles.who}><strong>{user.name}</strong><span>{user.email}</span></p>
                      <Link to={accountPath} role="menuitem" className={styles.item}><Icon name="user" size={16} />{accountLabel}</Link>
                      <button type="button" role="menuitem" className={styles.item} onClick={logout} disabled={busy}><Icon name="logout" size={16} />Log out</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className={styles.login}>Log in</Link>
              )}
            </span>
            <button ref={toggleRef} type="button" className={styles.burger} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
              <Icon name={open ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Outside <header>: the header's blur would otherwise trap these inside its own box. */}
      {open && <button type="button" className={styles.scrim} aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />}
      {open && (
        <nav id="mobile-menu" className={styles.mobile} aria-label="Mobile">
          <div className={styles.mobileTop}>
            <Link to="/" className={styles.mobileBrand} aria-label="OUR — One Unified Ride, home"><Logo size="sm" className={styles.logo} /></Link>
            <button ref={closeRef} type="button" className={styles.closeBtn} aria-label="Close menu" onClick={() => setOpen(false)}><Icon name="close" size={22} /></button>
          </div>

          {authed && (
            <div className={styles.mobileUser}>
              {avatar}
              <div><strong className={styles.mobileName}>{user.name}</strong><span className={styles.mobileMail}>{user.email}</span></div>
            </div>
          )}

          <ul>{links(true)}</ul>

          <div className={styles.mobileActions}>
            {authed ? (
              <>
                <Link to={accountPath} className={styles.login}><Icon name="user" size={18} />{accountLabel}</Link>
                <button type="button" className={styles.logout} onClick={logout} disabled={busy}><Icon name="logout" size={18} />Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.login}>Log in</Link>
                <Link to="/signup" className={styles.cta}>Sign up</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </>
  );
}