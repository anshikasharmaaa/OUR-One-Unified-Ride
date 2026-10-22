import { Children, useCallback, useEffect, useRef, useState } from 'react';
import styles from './ProviderCarousel.module.css';

const PAD = 4; // matches the track's horizontal padding

const Chevron = ({ dir }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
);

/** Horizontally scrolling, scroll-snapped row. Children must be <li>. `header` sits left of the arrows. Only this strip scrolls, never the page. */
export default function ProviderCarousel({ label, focusId, header, children }) {
    const track = useRef(null);
    const [edge, setEdge] = useState({ start: true, end: true });
    const [active, setActive] = useState(0);
    const count = Children.count(children);

    const measure = useCallback(() => {
        const el = track.current;
        if (!el) return;
        const start = el.scrollLeft <= 2;
        const end = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
        setEdge((p) => (p.start === start && p.end === end ? p : { start, end }));
        const items = Array.from(el.children);
        let best = 0;
        let bestDist = Infinity;
        items.forEach((li, i) => {
            const d = Math.abs(li.offsetLeft - PAD - el.scrollLeft);
            if (d < bestDist) { best = i; bestDist = d; }
        });
        if (end && !start) best = items.length - 1;
        setActive(best);
    }, []);

    useEffect(() => {
        const el = track.current;
        if (!el) return undefined;
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        Array.from(el.children).forEach((c) => ro.observe(c));
        return () => ro.disconnect();
    }, [measure, count]);

    // Bring a previously chosen card into view (returning from a booking) without moving the page vertically.
    useEffect(() => {
        const el = track.current;
        if (!el || !focusId) return;
        const node = el.querySelector(`[data-card-id="${CSS.escape(focusId)}"]`)?.closest('li');
        if (node) el.scrollLeft = Math.max(0, node.offsetLeft - (el.clientWidth - node.offsetWidth) / 2);
    }, [focusId]);

    const goTo = (i) => {
        const el = track.current;
        const item = el?.children[Math.max(0, Math.min(count - 1, i))];
        if (!item) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollTo({ left: Math.max(0, item.offsetLeft - PAD), behavior: reduce ? 'auto' : 'smooth' });
    };

    const overflowing = !(edge.start && edge.end);

    return (
        <div className={styles.wrap}>
            {(header || overflowing) && (
                <div className={styles.bar}>
                    <div className={styles.header}>{header}</div>
                    {overflowing && (
                        <div className={styles.nav}>
                            <button type="button" className={styles.arrow} onClick={() => goTo(active - 1)} disabled={edge.start} aria-label={`Previous ${label}`}><Chevron dir="left" /></button>
                            <button type="button" className={styles.arrow} onClick={() => goTo(active + 1)} disabled={edge.end} aria-label={`Next ${label}`}><Chevron dir="right" /></button>
                        </div>
                    )}
                </div>
            )}
            <ul ref={track} className={styles.track} role="list" aria-label={label} onScroll={measure}>
                {children}
            </ul>
            {overflowing && count > 1 && (
                <div className={styles.dots}>
                    {Array.from({ length: count }, (_, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`${styles.dot} ${i === active ? styles.dotOn : ''}`}
                            aria-label={`Show option ${i + 1} of ${count}`}
                            aria-current={i === active || undefined}
                            onClick={() => goTo(i)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}