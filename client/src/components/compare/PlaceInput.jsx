import { useEffect, useId, useRef, useState } from 'react';
import Icon from '../common/Icon';
import { SERVICE_AREA } from '../../config/serviceArea';
import styles from './PlaceInput.module.css';

const PHOTON = 'https://photon.komoot.io/api/';
const DEBOUNCE_MS = 350;
const MIN_CHARS = 3;
const [LAT, LNG] = SERVICE_AREA.center;

const uniq = (arr) => arr.filter((v, i) => v && arr.indexOf(v) === i);

// Photon returns one representative point per result: exact for places/addresses, but only a mid-point for streets and areas.
const kindOf = (p) => (p.type === 'street' ? 'Street' : ['locality', 'district', 'city', 'county', 'state'].includes(p.type) ? 'Area' : 'Place');

function toItem(f) {
    const p = f.properties || {};
    const [lng, lat] = f.geometry?.coordinates || [];
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    const street = [p.housenumber, p.street].filter(Boolean).join(' ');
    const main = p.name || street || p.district || p.city || '';
    const secondary = uniq([p.name ? street : '', p.district, p.city || p.county, p.state, p.postcode]).filter((s) => s !== main).join(', ');
    const address = uniq([p.name, street, p.district, p.city || p.county, p.state, p.postcode]).join(', ');
    if (!main || !p.osm_id) return null;
    return { placeId: `${p.osm_type || 'X'}${p.osm_id}`, main, secondary, address: address.slice(0, 300), lat, lng, kind: kindOf(p) };
}

export default function PlaceInput({ id, inputRef, tone = 'light', icon = 'pin', placeholder, value, place, onChange, onSelect, error, onLocate }) {
    const listId = useId();
    const errId = `${id}-err`;
    const [focused, setFocused] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [active, setActive] = useState(-1);
    const seq = useRef(0);

    const query = value.trim();
    const searchable = !place && query.length >= MIN_CHARS;

    // Debounced suggestions. Cleanup aborts the in-flight request so a slow old response can never overwrite a newer one.
    useEffect(() => {
        if (!focused || !searchable) { setItems([]); setLoading(false); setFetchError(''); return undefined; }
        const ctrl = new AbortController();
        const mine = ++seq.current;
        setLoading(true);
        setFetchError('');
        const timer = setTimeout(async () => {
            try {
                const qs = new URLSearchParams({
                    q: `${query}`, limit: '6', lang: 'en', lat: String(LAT), lon: String(LNG),
                    bbox: SERVICE_AREA.bbox.join(','),
                });
                const res = await fetch(`${PHOTON}?${qs}`, { signal: ctrl.signal });
                if (!res.ok) throw new Error(`photon ${res.status}`);
                const data = await res.json();
                if (mine !== seq.current) return;
                const seen = new Set();
                setItems((data.features || []).map(toItem).filter((it) => it && !seen.has(it.placeId) && seen.add(it.placeId)));
                setActive(-1);
            } catch (e) {
                if (e.name === 'AbortError') return;
                setItems([]);
                setFetchError('We couldn’t load suggestions. Check your connection and keep typing.');
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        }, DEBOUNCE_MS);
        return () => { clearTimeout(timer); ctrl.abort(); };
    }, [query, searchable, focused]);

    function choose(item) {
        if (!item) return;
        onSelect({ placeId: item.placeId, address: item.address || item.main, lat: item.lat, lng: item.lng });
        setItems([]);
    }

    const noResults = focused && searchable && !loading && !fetchError && items.length === 0;
    const open = focused && searchable && (loading || items.length > 0 || !!fetchError || noResults);

    function onKeyDown(e) {
        if (e.key === 'Escape') { setFocused(false); e.currentTarget.blur(); return; }
        if (!open || !items.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % items.length); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? items.length - 1 : i - 1)); }
        else if (e.key === 'Enter') { e.preventDefault(); choose(items[active >= 0 ? active : 0]); }
    }

    return (
        <div className={`${styles.wrap} ${tone === 'dark' ? styles.dark : ''} ${error ? styles.invalid : ''}`}>
            <div className={styles.field}>
                <span className={styles.lead} aria-hidden="true"><Icon name={icon} size={16} /></span>
                <input
                    id={id} ref={inputRef} className={styles.input} type="text" role="combobox" autoComplete="off" spellCheck={false}
                    placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onKeyDown={onKeyDown}
                    aria-label={placeholder} aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
                    aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
                    aria-invalid={error ? true : undefined} aria-describedby={error ? errId : undefined}
                />
                {loading && <span className={styles.spinner} role="status" aria-label="Loading suggestions" />}
                {place && !loading && <span className={styles.ok} aria-label="Location selected">✓</span>}
                {onLocate && (
                    <button type="button" className={styles.locate} onClick={onLocate} aria-label="Use my current location" title="Use my current location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                        </svg>
                    </button>
                )}
            </div>

            {open && (
                <ul id={listId} className={styles.list} role="listbox" aria-label={`${placeholder} suggestions`}>
                    {items.map((it, i) => (
                        <li
                            key={it.placeId} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                            className={`${styles.opt} ${i === active ? styles.active : ''}`}
                            onMouseDown={(e) => e.preventDefault()} onClick={() => choose(it)} onMouseEnter={() => setActive(i)}
                        >
                            <span className={styles.row}>
                                <span className={styles.main}>{it.main}</span>
                                <span className={`${styles.kind} ${it.kind !== 'Place' ? styles.approx : ''}`} title={it.kind !== 'Place' ? 'Approximate point: choose a specific place for a more accurate route' : undefined}>{it.kind}</span>
                            </span>
                            {it.secondary && <span className={styles.sub}>{it.secondary}</span>}
                        </li>
                    ))}
                    {loading && items.length === 0 && <li className={styles.note} role="presentation">Searching…</li>}
                    {noResults && <li className={styles.note} role="presentation">No places found in {SERVICE_AREA.name}. Try a landmark or area name.</li>}
                    {fetchError && <li className={`${styles.note} ${styles.bad}`} role="alert">{fetchError}</li>}
                </ul>
            )}

            {error && <p id={errId} className={styles.err} role="alert">{error}</p>}
        </div>
    );
}