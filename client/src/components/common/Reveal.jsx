import { useEffect, useRef, useState } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion';
import styles from './Reveal.module.css';

/** Fades and lifts its content into view once, the first time it scrolls into the viewport. */
export default function Reveal({ as: Tag = 'div', delay = 0, zoom = false, className = '', style, children, ...rest }) {
    const ref = useRef(null);
    const reduced = useReducedMotion();
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (reduced || !el || !('IntersectionObserver' in window)) { setShown(true); return undefined; }
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setShown(true); io.disconnect(); }
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        io.observe(el);
        return () => io.disconnect();
    }, [reduced]);

    return (
        <Tag ref={ref} className={`${styles.reveal} ${zoom ? styles.zoom : ''} ${shown ? styles.in : ''} ${className}`} style={{ ...style, '--d': `${delay}ms` }} {...rest}>
            {children}
        </Tag>
    );
}