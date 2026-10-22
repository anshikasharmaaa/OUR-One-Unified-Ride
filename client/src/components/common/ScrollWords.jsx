import { useEffect, useRef, useState } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion';
import styles from './ScrollWords.module.css';

/** Text whose words fade from faint to solid as it scrolls through the viewport. */
export default function ScrollWords({ as: Tag = 'h2', text, className = '', id }) {
    const ref = useRef(null);
    const reduced = useReducedMotion();
    const words = text.split(' ');
    const count = words.length;
    const [lit, setLit] = useState(reduced ? count : 0);

    useEffect(() => {
        if (reduced) { setLit(count); return undefined; }
        const el = ref.current;
        if (!el) return undefined;
        let raf = 0;
        const update = () => {
            raf = 0;
            const vh = window.innerHeight;
            const r = el.getBoundingClientRect();
            const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.4 + r.height)));
            setLit(Math.round(p * count));
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [reduced, count]);

    return (
        <Tag ref={ref} id={id} className={`${styles.root} ${className}`}>
            {words.map((w, i) => (
                <span key={`${w}-${i}`}>{i > 0 ? ' ' : ''}<span className={i < lit ? styles.on : styles.off}>{w}</span></span>
            ))}
        </Tag>
    );
}