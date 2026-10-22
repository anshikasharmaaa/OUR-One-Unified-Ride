import { formatDayKey } from '../../utils/format';
import styles from './BarChart.module.css';

/** Minimal accessible bar chart: one bar per day. */
export default function BarChart({ days, values, label }) {
  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...values);
  const W = 600, H = 200, padL = 28, padB = 26, padT = 10;
  const bw = (W - padL) / values.length;
  const tickEvery = Math.ceil(values.length / 7);
  const ticks = max === 1 ? [0, 1] : [0, Math.round(max / 2), max];
  return (
    <figure className={styles.fig}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${total} in total over ${values.length} days`}>
        {ticks.map((t) => {
          const y = padT + (H - padB - padT) * (1 - t / max);
          return <g key={t}><line x1={padL} x2={W} y1={y} y2={y} stroke="#e3e9f7" /><text x={padL - 6} y={y + 4} textAnchor="end" className={styles.axis}>{t}</text></g>;
        })}
        {values.map((v, i) => {
          const h = ((H - padB - padT) * v) / max;
          const x = padL + i * bw + bw * 0.18;
          return (
            <g key={days[i]}>
              <rect x={x} y={H - padB - h} width={bw * 0.64} height={Math.max(h, v ? 2 : 0)} rx="3" className={styles.bar}><title>{`${formatDayKey(days[i])}: ${v}`}</title></rect>
              {i % tickEvery === 0 && <text x={x + bw * 0.32} y={H - 8} textAnchor="middle" className={styles.axis}>{formatDayKey(days[i])}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className={styles.cap}>{total === 0 ? 'No activity recorded in this period.' : `${total} in total`}</figcaption>
    </figure>
  );
}
