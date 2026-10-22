import { useEffect, useRef, useState } from 'react';
import Section from './Section';
import styles from './HowItWorks.module.css';

const STEPS = [
  { n: 1, title: 'Enter pickup and destination', text: 'Tell OUR where you are starting and where you want to go.', pos: 'above' },
  { n: 2, title: 'Compare options and estimates', text: 'Review the available ride options and their estimated fares side by side.', pos: 'below' },
  { n: 3, title: 'Choose and continue', text: 'Pick the option that suits you and continue to the provider where supported.', pos: 'belowLeft' },
];
const W = 1000;
const H = 420;
const ROAD = 'M30 360 C 220 385 260 250 420 232 C 580 214 600 332 760 272 C 880 228 900 120 975 70';
const FALLBACK = [{ x: 12, y: 84 }, { x: 52, y: 58 }, { x: 90, y: 20 }];

export default function HowItWorks() {
  const pathRef = useRef(null);
  const [pts, setPts] = useState(FALLBACK);
  useEffect(() => {
    const p = pathRef.current;
    if (!p?.getTotalLength) return;
    const len = p.getTotalLength();
    setPts([0.11, 0.52, 0.9].map((f) => { const q = p.getPointAtLength(len * f); return { x: (q.x / W) * 100, y: (q.y / H) * 100 }; }));
  }, []);

  return (
    <Section id="how" tone="soft" eyebrow="How OUR works" title="Your roadmap to the right ride" intro="Three simple steps from “where to?” to “this one”.">
      <div className={styles.map}>
        <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d={ROAD} fill="none" stroke="rgba(37,99,235,0.12)" strokeWidth="74" strokeLinecap="round" />
          <path ref={pathRef} d={ROAD} fill="none" stroke="#0f1b3d" strokeWidth="46" strokeLinecap="round" />
          <path d={ROAD} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="3" strokeDasharray="14 14" strokeLinecap="round" />
        </svg>
        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li key={s.n} className={styles.step} style={{ '--x': `${pts[i].x}%`, '--y': `${pts[i].y}%` }}>
              <span className={styles.node} aria-hidden="true">{s.n}</span>
              <div className={`${styles.label} ${styles[s.pos]}`}>
                <h3><span className="visually-hidden">Step {s.n}: </span>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}