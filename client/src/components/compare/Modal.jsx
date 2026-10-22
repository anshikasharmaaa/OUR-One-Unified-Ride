import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, labelledBy, describedBy, children }) {
    const box = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const previous = document.activeElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const first = box.current?.querySelector('[data-autofocus]') || box.current?.querySelector(FOCUSABLE);
        first?.focus();

        const onKey = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
            if (e.key !== 'Tab' || !box.current) return;
            const nodes = [...box.current.querySelectorAll(FOCUSABLE)];
            if (!nodes.length) return;
            const a = nodes[0];
            const z = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
            else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
            previous?.focus?.();
        };
    }, [open, onClose]);

    if (!open) return null;
    return createPortal(
        <div className={styles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
            <div ref={box} className={styles.box} role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy}>
                {children}
            </div>
        </div>,
        document.body,
    );
}