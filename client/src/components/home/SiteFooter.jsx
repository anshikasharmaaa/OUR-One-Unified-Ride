import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '../../config/contact';
import styles from './SiteFooter.module.css';

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.about}>
          <span className={styles.plate}><Logo size="sm" /></span>
          <p>Compare rides across options in one search and make a better travel decision. Starting with commuters in Indore and Bhopal.</p>
        </div>
        <nav aria-label="Explore OUR">
          <h2>Explore</h2>
          <ul>
            <li><Link to="/search">Search rides</Link></li>
            <li><Link to={{ pathname: '/', hash: '#explore' }}>Ride options</Link></li>
            <li><Link to={{ pathname: '/', hash: '#about' }}>About OUR</Link></li>
            <li><Link to={{ pathname: '/', hash: '#faq' }}>Help &amp; FAQs</Link></li>
          </ul>
        </nav>
        <nav aria-label="Accounts">
          <h2>Accounts</h2>
          <ul>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/signup">Create an account</Link></li>
          </ul>
        </nav>
        <nav aria-label="Contact">
          <h2>Contact</h2>
          <ul>
            <li><Link to={{ pathname: '/', hash: '#contact' }}>Contact us</Link></li>
            <li><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
            <li><a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a></li>
          </ul>
        </nav>
      </div>
      <div className="container">
        <div className={styles.base}>
          <p>© {new Date().getFullYear()} OUR — One Unified Ride. One Search, Infinite Choices.</p>
          <p>Fares shown on OUR are estimates; final prices are set by the provider.</p>
        </div>
      </div>
    </footer>
  );
}