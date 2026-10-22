import { useState } from 'react';
import Section from './Section';
import { VehicleSvg } from './vehicles';
import styles from './WhyOur.module.css';

const ITEMS = [
  { type: 'bike', title: 'Every option in one place', text: 'Stop hopping between apps. See the ride types available for your trip side by side.', stat: '4', cap: 'ride types, one search' },
  { type: 'auto', title: 'Understand estimated fares', text: 'Fares are always labelled as estimates — the provider sets the final price.', stat: 'Est.', cap: 'fares, clearly labelled' },
  { type: 'economy', title: 'Save time', text: 'Enter your trip once instead of repeating it in several apps while the clock is ticking.', stat: '1×', cap: 'enter your trip once' },
  { type: 'premium', title: 'Make informed choices', text: 'Weigh cost, comfort and convenience yourself, with the information in front of you.', stat: 'You', cap: 'decide, with the facts' },
];

export default function WhyOur() {
  const [active, setActive] = useState(0);
  const cur = ITEMS[active];
  return (
    <Section id="why" tone="plain" eyebrow="Why OUR" title="A clearer way to choose your ride" intro="OUR is built around one idea: you should see your options before you decide.">
      <div className={styles.grid}>
        <ul className={styles.list}>
          {ITEMS.map((it, i) => (
            <li key={it.title}>
              <button type="button" className={`${styles.row} ${i === active ? styles.on : ''}`} aria-pressed={i === active} onClick={() => setActive(i)} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>
                <span className={styles.no}>0{i + 1}</span>
                <span className={styles.txt}><strong>{it.title}</strong><small>{it.text}</small></span>
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.panel} aria-hidden="true">
          <span className={styles.orb} />
          <VehicleSvg key={cur.type} type={cur.type} className={styles.car} />
          <span className={styles.road} />
          <div key={cur.stat} className={styles.stat}><strong>{cur.stat}</strong><span>{cur.cap}</span></div>
        </div>
      </div>
    </Section>
  );
}