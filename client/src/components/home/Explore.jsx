import { useState } from 'react';
import { Link } from 'react-router-dom';
import Section from './Section';
import Icon from '../common/Icon';
import { VehicleSvg } from './vehicles';
import styles from './Explore.module.css';

const OPTIONS = [
  { type: 'bike', value: 'BIKE', name: 'Bike', text: 'Quick, budget-friendly rides for solo travellers — ideal for slipping through traffic on shorter trips.' },
  { type: 'auto', value: 'AUTO', name: 'Auto', text: 'The familiar three-wheeler for short and mid-distance hops around the city.' },
  { type: 'economy', value: 'ECONOMY_CAB', name: 'Economy Cab', text: 'Everyday hatchbacks and sedans with room for bags, family or friends.' },
  { type: 'premium', value: 'PREMIUM_CAB', name: 'Premium Cab', text: 'A more comfortable car for airport runs, meetings or when you want a calmer ride.' },
];

export default function Explore() {
  const [active, setActive] = useState(0);
  return (
    <Section id="explore" tone="tint">
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>Explore</p>
          <h2 id="explore-title" className={styles.title}>PICK THE RIDE<br /><span>FOR YOUR TRIP</span></h2>
        </div>
        <Link to="/search" className={styles.all}>COMPARE ALL <Icon name="arrowRight" size={16} /></Link>
      </div>
      <ul className={styles.grid}>
        {OPTIONS.map((o, i) => (
          <li key={o.type} className={`${styles.card} ${i === active ? styles.on : ''}`} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}>
            <div className={styles.copy}>
              <span className={styles.no}>0{i + 1}</span>
              <h3>{o.name}</h3>
              <p className={styles.text}>{o.text}</p>
            </div>
            <div className={styles.art} aria-hidden="true"><VehicleSvg type={o.type} className={styles.vehicle} /></div>
            <div className={styles.foot}>
              <Link className={styles.read} to={`/search?vehicle=${o.value}`}>Compare {o.name.toLowerCase()}s</Link>
              <Link className={styles.round} to={`/search?vehicle=${o.value}`} aria-label={`Compare ${o.name.toLowerCase()}s`}><Icon name="arrowRight" size={16} /></Link>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}