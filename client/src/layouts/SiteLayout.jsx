import { Outlet } from 'react-router-dom';
import SiteNavbar from '../components/home/SiteNavbar';
import SiteFooter from '../components/home/SiteFooter';
import useScrollToHash from '../hooks/useScrollToHash';
import styles from './SiteLayout.module.css';

export default function SiteLayout() {
  useScrollToHash();
  return (
    <div className={styles.site}>
      <a href="#main" className="skip-link">Skip to main content</a>
      <SiteNavbar />
      <main id="main" tabIndex={-1} className={styles.main}><Outlet /></main>
      <SiteFooter />
    </div>
  );
}
