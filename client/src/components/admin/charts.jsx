import { formatDayKey } from '../../utils/format';
import styles from './charts.module.css';

export const COLORS = { blue: '#3b5bdb', cyan: '#22b8cf', amber: '#f59f00', green: '#12b886', red: '#e8590c' };
const sum = (a) => a.reduce((x, y) => x + y, 0);

export function Legend({ items }) {
    return (
        <ul className={styles.legend}>
            {items.map((i) => (
                <li key={i.label}><span className={styles.dot} style={{ background: i.color }} />{i.label}{i.value != null && <strong>{i.value}</strong>}</li>
            ))}
        </ul>
    );
}

/** Multi-series line chart. series: [{ key, label, color, values[] }], one value per day. */
export function TrendChart({ days, series, label }) {
    const W = 640, H = 230, L = 34, R = 12, T = 14, B = 30;
    const all = series.flatMap((s) => s.values);
    const max = Math.max(1, ...all);
    const empty = all.every((v) => v === 0);
    const x = (i) => L + (W - L - R) * (days.length > 1 ? i / (days.length - 1) : 0.5);
    const y = (v) => T + (H - T - B) * (1 - v / max);
    const ticks = max <= 3 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, Math.round(max / 2), max];
    const every = Math.ceil(days.length / 7);
    return (
        <figure className={styles.fig}>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${series.map((s) => `${s.label} ${sum(s.values)}`).join(', ')}`}>
                {ticks.map((t) => (
                    <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e6eaf7" /><text x={L - 6} y={y(t) + 4} textAnchor="end" className={styles.axis}>{t}</text></g>
                ))}
                {days.map((d, i) => (i % every === 0 ? <text key={d} x={x(i)} y={H - 8} textAnchor="middle" className={styles.axis}>{formatDayKey(d)}</text> : null))}
                {series.map((s) => (
                    <g key={s.key}>
                        <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
                        {s.values.map((v, i) => (
                            <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2"><title>{`${s.label} · ${formatDayKey(days[i])}: ${v}`}</title></circle>
                        ))}
                    </g>
                ))}
            </svg>
            <Legend items={series.map((s) => ({ label: s.label, color: s.color, value: sum(s.values) }))} />
            {empty && <figcaption className={styles.cap}>No activity recorded in this period.</figcaption>}
        </figure>
    );
}

/** Ring chart. items: [{ label, value, color }]. */
export function DonutChart({ items, centerLabel }) {
    const total = sum(items.map((i) => i.value));
    const R = 54, C = 2 * Math.PI * R;
    let acc = 0;
    return (
        <figure className={styles.donutFig}>
            <svg viewBox="0 0 140 140" role="img" aria-label={`${centerLabel}: ${items.map((i) => `${i.label} ${i.value}`).join(', ')}`}>
                <circle cx="70" cy="70" r={R} fill="none" stroke="#eef1fb" strokeWidth="16" />
                {total > 0 && items.filter((i) => i.value > 0).map((i) => {
                    const len = (C * i.value) / total;
                    const el = <circle key={i.label} cx="70" cy="70" r={R} fill="none" stroke={i.color} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)"><title>{`${i.label}: ${i.value}`}</title></circle>;
                    acc += len;
                    return el;
                })}
                <text x="70" y="68" textAnchor="middle" className={styles.donutNum}>{total}</text>
                <text x="70" y="85" textAnchor="middle" className={styles.donutLbl}>{centerLabel}</text>
            </svg>
            <Legend items={items.map((i) => ({ label: i.label, color: i.color, value: i.value }))} />
            {total === 0 && <figcaption className={styles.cap}>Nothing to show yet.</figcaption>}
        </figure>
    );
}

/** Vertical bars with the value above each bar; the largest bar is highlighted. items: [{ label, value }]. */
export function ValueBars({ items }) {
    const max = Math.max(0, ...items.map((i) => i.value));
    return (
        <div className={styles.bars} role="list">
            {items.map((i) => (
                <div key={i.label} className={styles.col} role="listitem" aria-label={`${i.label}: ${i.value}`}>
                    <span className={styles.val}>{i.value}</span>
                    <span className={`${styles.bar} ${max > 0 && i.value === max ? styles.barTop : ''}`} style={{ height: max ? `${Math.max(3, (i.value / max) * 78)}%` : '3%' }} />
                    <span className={styles.lbl}>{i.label}</span>
                </div>
            ))}
        </div>
    );
}