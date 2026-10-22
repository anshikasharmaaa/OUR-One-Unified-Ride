import Section from './Section';
import Logo from '../common/Logo';
import Icon from '../common/Icon';
import { VehicleSvg } from './vehicles';
import styles from './About.module.css';

const PILLARS = [
  { icon: 'receipt', title: 'Fare transparency', text: 'Travel costs should not be a guessing game. OUR shows estimates clearly and tells you they are estimates.' },
  { icon: 'layers', title: 'Convenience', text: 'One search instead of many. Less switching, less waiting, fewer tabs.' },
  { icon: 'compass', title: 'Long-term vision', text: 'Everyday travel in India’s growing cities, easier to understand and easier to choose.' },
];
const FACTS = [
  { v: 'soon', l: 'launch in cities of', s: 'Madhya Pradesh' },
  { v: '4', l: 'ride types', s: 'bike to premium' },
  { v: 'Est.', l: 'fares, always', s: 'never guarantees' },
  { v: '180', l: 'day retention', s: 'for search records' },
];

export default function About() {
  return (
    <Section id="about" tone="tint" eyebrow="About OUR" title="One Unified Ride" intro="OUR exists so that choosing how to get from A to B feels simple, open and fair.">
      <div className={styles.grid}>
        <ul className={styles.pillars}>
          {PILLARS.map((p) => (
            <li key={p.title}>
              <span className={styles.icon}><Icon name={p.icon} size={20} /></span>
              <div><h3>{p.title}</h3><p>{p.text}</p></div>
            </li>
          ))}
        </ul>
        <div className={styles.panel} aria-hidden="true">
          <span className={styles.plate}><Logo size="sm" /></span>
          <p className={styles.tag}>One Search, Infinite Choices.</p>
          <ul className={styles.facts}>
            {FACTS.map((f) => (<li key={f.l}><strong>{f.v}</strong><span>{f.l}</span><small>{f.s}</small></li>))}
          </ul>
          <div className={styles.row}>
            {['bike', 'auto', 'economy', 'premium'].map((t) => (<span key={t} className={styles.mini}><VehicleSvg type={t} /></span>))}
          </div>
        </div>
      </div>
    </Section>
  );
}