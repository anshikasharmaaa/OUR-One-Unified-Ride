import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../common/Icon';
import styles from './admin.module.css';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export default function AdminDialog({ open, title, onClose, children }) {
    const box = useRef(null);
    useEffect(() => {
        if (!open) return undefined;
        const previous = document.activeElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        box.current?.querySelector('input,select,textarea')?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
            if (e.key !== 'Tab' || !box.current) return;
            const nodes = [...box.current.querySelectorAll(FOCUSABLE)];
            if (!nodes.length) return;
            const a = nodes[0], z = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
            else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; previous?.focus?.(); };
    }, [open, onClose]);
    if (!open) return null;
    return createPortal(
        <div className={styles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div ref={box} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
                <div className={styles.dialogHead}>
                    <h2 id="admin-dialog-title">{title}</h2>
                    <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close"><Icon name="close" /></button>
                </div>
                <div className={styles.dialogBody}>{children}</div>
            </div>
        </div>,
        document.body,
    );
}