import { Helmet } from 'react-helmet-async';
import Logo from '../common/Logo';
import styles from './AuthLayout.module.css';

const CHIPS = [
  { mode: 'Cab', price: '₹182', eta: '12 min' },
  { mode: 'Auto', price: '₹96', eta: '9 min' },
  { mode: 'Bike taxi', price: '₹64', eta: '6 min' },
];

// Text for the left side, picked from how the page is used (no extra props needed).
const panelFor = ({ noIndex, badge }) => {
  if (noIndex) return { eyebrow: 'Admin console', title: 'Manage OUR with confidence.', lede: 'Approvals, users, drivers and activity in one place.', chips: false };
  if (badge) return { eyebrow: 'Driver partners', title: 'Drive with OUR.', lede: 'Register your details. Every request is reviewed by an administrator before access is granted.', chips: false };
  return { eyebrow: 'Ride comparison', title: 'One Search, Infinite Choices.', lede: 'Compare cabs, autos and bike taxis across providers and pick the ride that suits you.', chips: true };
};

/** Brand on the gradient (left) + one form card (right). `wide` gives the form more room (driver registration). */
export default function AuthLayout({ title, subtitle, children, pageTitle, noIndex = false, badge, wide = false }) {
  const panel = panelFor({ noIndex, badge });
  return (
    <div className={styles.page}>
      <Helmet>
        <title>{`${pageTitle || title} · OUR`}</title>
        {noIndex && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>

      <div className={`${styles.shell} ${wide ? styles.wide : ''}`}>
        <aside className={styles.brand}>
          <span className={styles.plate}><Logo size="sm" className={styles.plateLogo} /></span>
          <p className={styles.eyebrow}>{panel.eyebrow}</p>
          <p className={styles.headline}>{panel.title}</p>
          <p className={styles.lede}>{panel.lede}</p>
          {panel.chips && (
            <div aria-hidden="true">
              <ul className={styles.chips}>
                {CHIPS.map((c) => (
                  <li key={c.mode}><span>{c.mode}</span><b>{c.price}</b><i>{c.eta}</i></li>
                ))}
              </ul>
              <p className={styles.caption}>Illustrative fares</p>
            </div>
          )}
        </aside>

        <main className={styles.card} aria-labelledby="auth-title">
          <div className={styles.brandRow}><Logo size="sm" className={styles.formLogo} /></div>
          {badge && <p className={styles.badge}>{badge}</p>}
          <h1 id="auth-title" className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          <div className={styles.body}>{children}</div>
        </main>
      </div>
    </div>
  );
}