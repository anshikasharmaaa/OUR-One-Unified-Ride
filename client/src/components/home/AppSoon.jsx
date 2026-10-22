import { Link } from 'react-router-dom';
import Section from './Section';
import Icon from '../common/Icon';
import { VehicleSvg } from './vehicles';
import styles from './AppSoon.module.css';

const FLOAT = [
  { cls: 'fa', mode: 'Cab', price: '₹182' },
  { cls: 'fb', mode: 'Auto', price: '₹96' },
  { cls: 'fc', mode: 'Bike taxi', price: '₹64' },
];

export default function AppSoon() {
  return (
    <Section id="app" tone="plain">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <p className={styles.soon}>Coming soon</p>
          <h2>Compare, Choose &amp; <span className={styles.hl}>Ride</span> With OUR</h2>
          <p className={styles.lede}>The all-in-one way to compare your ride options is coming to your pocket. There is nothing to download yet — when the app is ready, we’ll announce it here.</p>
          <div className={styles.stores} aria-label="App stores, coming soon">
            <span className={styles.store} aria-disabled="true"><small>Get it on</small><strong>Google Play</strong><em>Coming soon</em></span>
            <span className={styles.store} aria-disabled="true"><small>Download on the</small><strong>App Store</strong><em>Coming soon</em></span>
          </div>
          <Link to="/search" className={styles.cta}>Use OUR on the web today <Icon name="arrowRight" size={16} /></Link>
        </div>
        <div className={styles.stage} aria-hidden="true">
          <span className={styles.disc} />
          <div className={styles.phone}>
            <div className={styles.notch} />
            <div className={styles.screen}>
              <p className={styles.hi}>Where to?</p>
              <div className={styles.field}><Icon name="target" size={14} />Pickup</div>
              <div className={styles.field}><Icon name="pin" size={14} />Drop-off</div>
              <div className={styles.go}>Compare rides</div>
              <ul className={styles.modes}>
                {['bike', 'auto', 'economy', 'premium'].map((t) => (<li key={t}><VehicleSvg type={t} /></li>))}
              </ul>
            </div>
          </div>
          {FLOAT.map((f) => (<span key={f.mode} className={`${styles.float} ${styles[f.cls]}`}>{f.mode}<b>{f.price}</b></span>))}
          <span className={styles.cap}>Illustrative fares</span>
        </div>
      </div>
    </Section>
  );
}