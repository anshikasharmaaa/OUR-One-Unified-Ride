import { useEffect, useMemo, useState } from 'react';
import styles from './ProviderLogo.module.css';

// Official logos can live in EITHER place:
//  1) src/assets/providers/    any file name containing the provider id (Rapido-logo.png, uber_logo.jpg, OLA.svg ...)
//  2) public/assets/providers/ exact names: rapido|ola|uber (or Rapido|Ola|Uber) + .svg .png .jpg .jpeg .webp .avif
// An admin-set `src` (https URL or /assets/ path) is tried first. If nothing loads, nothing is drawn: no fake logo.
const bundled = import.meta.glob('../../assets/providers/*.{svg,png,jpg,jpeg,webp,avif}', { eager: true, query: '?url', import: 'default' });
const EXT = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'avif'];

function bundledUrl(id) {
    const re = new RegExp(`(^|[^a-z])${id}([^a-z]|$)`);
    for (const [path, url] of Object.entries(bundled)) {
        const base = path.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase();
        if (re.test(base)) return url;
    }
    return null;
}

export default function ProviderLogo({ id, name, size = 'sm', src }) {
    const sources = useMemo(() => {
        const list = [];
        if (src) list.push(src);
        const b = bundledUrl(id);
        if (b) list.push(b);
        const cap = id.charAt(0).toUpperCase() + id.slice(1);
        EXT.forEach((x) => { list.push(`/assets/providers/${id}.${x}`); list.push(`/assets/providers/${cap}.${x}`); });
        return list;
    }, [id, src]);
    const [i, setI] = useState(0);

    useEffect(() => setI(0), [id, src]);
    useEffect(() => {
        if (i >= sources.length && import.meta.env.DEV) console.warn(`Missing official logo for ${name}. Put it in src/assets/providers/ (any name containing "${id}") or public/assets/providers/${id}.png|svg|jpg`);
    }, [i, sources.length, id, name]);

    if (i >= sources.length) return null;
    return (
        <span className={`${styles.tile} ${size === 'md' ? styles.md : ''}`}>
            <img className={styles.img} src={sources[i]} alt="" aria-hidden="true" onError={() => setI((n) => n + 1)} />
        </span>
    );
}