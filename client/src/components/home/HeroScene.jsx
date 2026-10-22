import { VEHICLES } from './vehicles';
import styles from './HeroScene.module.css';

// Each vehicle: lane ground line, scale, speed (s), negative delay (so the street is already busy on load), resting x (reduced motion)
const TRAFFIC = [
  { type: 'bike', ground: 446, scale: 1.2, dur: 12, delay: -3, rest: 60 },
  { type: 'economy', ground: 446, scale: 1.2, dur: 17, delay: -11, rest: 330 },
  { type: 'auto', ground: 536, scale: 1.4, dur: 14, delay: -6, rest: 120 },
  { type: 'premium', ground: 536, scale: 1.4, dur: 20, delay: -15, rest: 380 },
];

const SKYLINE = [
  [30, 270, 60], [96, 230, 52], [154, 290, 48], [208, 250, 64], [278, 300, 44], [328, 240, 58],
  [392, 280, 50], [448, 220, 62], [516, 285, 46], [568, 255, 56],
];

const Person = ({ x, y, tone }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r="27" fill="#fff" stroke={tone} strokeWidth="3" />
    <circle cy="-6" r="8" fill="#f1c9a5" />
    <path d="M-14 17q0-13 14-13t14 13a27 27 0 0 1-28 0z" fill={tone} />
  </g>
);

export default function HeroScene() {
  return (
    <div className={styles.scene}>
      <svg className={styles.svg} viewBox="0 0 640 560" role="img" aria-label="Illustration of bikes, auto-rickshaws and cars sharing a city street while a rider searches for a trip">
        <rect width="640" height="560" rx="28" fill="#f3f7ff" />
        {/* faint road network */}
        <g stroke="#e1e9ff" strokeWidth="12" strokeLinecap="round" fill="none">
          <path d="M-10 120 C120 60 220 190 340 140 S560 70 660 130" />
          <path d="M80 -10 C110 80 70 160 130 240" />
          <path d="M470 -10 C440 70 520 130 500 230" />
        </g>
        {/* skyline */}
        <g>
          {SKYLINE.map(([x, y, w], i) => (
            <g key={x}>
              <rect x={x} y={y} width={w} height={392 - y} rx="4" fill={i % 2 ? '#dfe8ff' : '#e8efff'} />
              {[0, 1, 2].map((r) => (
                <rect key={r} x={x + 10} y={y + 14 + r * 24} width={w - 20} height="8" rx="2" fill="#f5f8ff" />
              ))}
            </g>
          ))}
        </g>
        {/* dotted route between rider, search and destination */}
        <path className={styles.route} d="M112 196 C 190 70, 450 70, 528 182" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 10" />
        <Person x={112} y={196} tone="#2563eb" />
        <Person x={528} y={182} tone="#0f1b3d" />
        <g transform="translate(320 82)">
          <circle r="32" fill="#2563eb" />
          <circle r="32" fill="none" stroke="#2563eb" strokeOpacity=".25" strokeWidth="8" className={styles.pulse} />
          <circle cx="-3" cy="-3" r="10" fill="none" stroke="#fff" strokeWidth="4" />
          <path d="m5 5 9 9" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* street */}
        <rect y="392" width="640" height="168" fill="#dce6fb" />
        <rect y="392" width="640" height="7" fill="#c6d6fb" />
        <path className={styles.lane} d="M0 478H640" stroke="#fff" strokeWidth="4" strokeDasharray="26 22" />
        {/* traffic */}
        {TRAFFIC.map((t) => {
          const v = VEHICLES[t.type];
          return (
            <g key={t.type} transform={`translate(0 ${t.ground - v.h * t.scale})`}>
              <g className={styles.drive} style={{ '--dur': `${t.dur}s`, '--delay': `${t.delay}s`, '--rest': `${t.rest}px` }}>
                <g transform={`scale(${t.scale})`}><v.Art /></g>
              </g>
            </g>
          );
        })}
      </svg>
      <span className={`${styles.chip} ${styles.chipA}`}>Your pickup</span>
      <span className={`${styles.chip} ${styles.chipB}`}>Your destination</span>
      <span className={`${styles.chip} ${styles.chipC}`}>Comparing options<i className={styles.dots} aria-hidden="true"><b /><b /><b /></i></span>
    </div>
  );
}
