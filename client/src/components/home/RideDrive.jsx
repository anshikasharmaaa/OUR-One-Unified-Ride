import { Link } from 'react-router-dom';
import Section from './Section';
import Icon from '../common/Icon';
import { useAuth } from '../../context/AuthContext';
import { dashboardFor } from '../../routes/paths';
import styles from './RideDrive.module.css';

export default function RideDrive() {
  const { status, user } = useAuth();
  const authed = status === 'authenticated';
  return (
    <Section id="ride" tone="tint" eyebrow="Ride and Drive" title="Whichever side of the ride you’re on" intro="OUR is being built for passengers first, with drivers joining step by step.">
      <div className={styles.grid}>
        <article className={styles.card} aria-labelledby="ride-h">
          <p className={styles.tag}>For passengers</p>
          <h3 id="ride-h">Ride with OUR</h3>
          <ul>
            <li><Icon name="check" size={18} />Search a trip and tell us which ride type you prefer.</li>
            <li><Icon name="check" size={18} />Create a free account, verified by email or Google.</li>
            <li><Icon name="check" size={18} />Fare comparison across providers is in development — your searches help shape it.</li>
          </ul>
          <div className={styles.actions}>
            <Link to="/search" className={styles.primary}>Search rides</Link>
            {!authed && <Link to="/signup" className={styles.secondary}>Create an account</Link>}
            {authed && <Link to={dashboardFor(user.role)} className={styles.secondary}>{user.role === 'USER' ? 'Open my account' : 'Go to my account'}</Link>}
          </div>
        </article>

        <article id="drive" className={`${styles.card} ${styles.dark}`} aria-labelledby="drive-h">
          <p className={styles.tag}>For drivers</p>
          <h3 id="drive-h">Drive with OUR</h3>
          <ul>
            <li><Icon name="check" size={18} />Request registration with your details and verify your email.</li>
            <li><Icon name="check" size={18} />Every request is reviewed by an administrator before access is granted.</li>
            <li><Icon name="check" size={18} />Ride assignment and the driver dashboard are not live yet.</li>
          </ul>
          <div className={styles.actions}>
            <Link to="/driver/register" className={styles.primaryLight}>Request registration</Link>
            <Link to="/driver/login" className={styles.secondaryDark}>Driver log in</Link>
          </div>
        </article>
      </div>
    </Section>
  );
}
