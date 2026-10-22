import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import styles from './PlaceholderPage.module.css';

export default function PlaceholderPage({ heading, children, tag }) {
  const { user } = useAuth();
  return (
    <section className={styles.panel}>
      <Helmet><title>{`${tag} · OUR`}</title></Helmet>
      <h1 className={styles.h1}>{heading(user)}</h1>
      <p className={styles.p}>{children}</p>
      <dl className={styles.meta}>
        <div><dt>Signed in as</dt><dd>{user.email}</dd></div>
        <div><dt>Access level</dt><dd>{user.role}</dd></div>
      </dl>
    </section>
  );
}
