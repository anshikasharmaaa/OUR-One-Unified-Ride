import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SearchPanel from './SearchPanel';
import HeroScene from './HeroScene';
import styles from './Hero.module.css';

export default function Hero() {
  const navigate = useNavigate();
  const { status, user } = useAuth();
  const rider = status === 'authenticated' && user.role === 'USER' ? (user.name || '').split(' ')[0] : '';
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.badge}>{rider ? `Welcome back, ${rider}` : 'Ride comparison for Indian cities'}</p>
          <h1 id="hero-title" className={styles.title}>
            <span className={styles.line}>Every Ride. Every Option.</span>
            <span className={styles.line}><mark className={styles.mark}>One Search.</mark></span>
          </h1>
          <p className={styles.lede}>
            OUR brings bikes, autos and cabs into one place so you can see your options side by side, understand estimated fares and choose the ride that fits your trip.
          </p>
          <SearchPanel tone="dark" idPrefix="hero" onSubmitted={(result, values) => navigate('/search', { state: { submitted: { ...values, result } } })} />
          <p className={styles.note}>Built first for commuters in Indore and Bhopal. Fares are estimates, never guarantees.</p>
        </div>
        <div className={styles.visual}><HeroScene /></div>
      </div>
    </section>
  );
}