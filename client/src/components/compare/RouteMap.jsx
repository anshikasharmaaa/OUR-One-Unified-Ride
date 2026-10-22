import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SERVICE_AREA } from '../../config/serviceArea';
import styles from './RouteMap.module.css';

// OpenStreetMap standard tiles: free, no key. Fine for development and light traffic (see their tile usage policy).
const TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// SVG pin: the tip is exactly bottom-centre, so the anchor is exact and doesn't depend on any global CSS.
const pinIcon = (color, label) =>
    L.divIcon({
        className: styles.pinWrap,
        html: `<svg width="36" height="46" viewBox="0 0 36 46" aria-hidden="true"><path d="M18 1C8.6 1 1 8.6 1 18c0 12.7 17 27 17 27s17-14.3 17-27C35 8.6 27.4 1 18 1z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="18" cy="18" r="9" fill="#fff"/><text x="18" y="22.5" text-anchor="middle" font-size="12" font-weight="800" fill="${color}" font-family="system-ui,sans-serif">${label}</text></svg>`,
        iconSize: [36, 46],
        iconAnchor: [18, 45],
        popupAnchor: [0, -42],
    });

// Simulated vehicle: a round navy badge, centred on its position.
const vehicleIcon = L.divIcon({
    className: styles.pinWrap,
    html: '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#0b1b46" stroke="#fff" stroke-width="3"/><path d="M9 18v-3l2-4h10l2 4v3M8.5 18h15" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="19" r="1.2" fill="#fff"/><circle cx="20" cy="19" r="1.2" fill="#fff"/></svg>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const popup = (title, address) => {
    const el = document.createElement('div'); // DOM nodes, not HTML strings: addresses come from outside
    const b = document.createElement('strong');
    b.textContent = title;
    const p = document.createElement('div');
    p.textContent = address;
    el.append(b, p);
    return el;
};

/**
 * Real road route (decoded from the server's OSRM result) on an interactive Leaflet map. `path` = [[lat,lng],...]
 * Optional `vehicle` = { lat, lng } draws a SIMULATED vehicle marker (demo bookings only) and moves it without rebuilding the map.
 * Keep pickup / dropoff / path referentially stable, or the map is rebuilt.
 */
export default function RouteMap({ pickup, dropoff, path, vehicle }) {
    const host = useRef(null);
    const api = useRef({});
    const vLat = vehicle?.lat;
    const vLng = vehicle?.lng;

    useEffect(() => {
        const a = [pickup.lat, pickup.lng];
        const b = [dropoff.lat, dropoff.lng];
        const map = L.map(host.current, { center: SERVICE_AREA.center, zoom: 12, zoomSnap: 0.25, scrollWheelZoom: false });
        L.tileLayer(TILE, { maxZoom: 19, attribution: ATTR }).addTo(map);

        L.polyline(path, { color: '#ffffff', weight: 10, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map); // casing
        L.polyline(path, { color: '#2563eb', weight: 6, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(map);

        const mA = L.marker(a, { icon: pinIcon('#16a34a', 'A'), title: 'Pickup', zIndexOffset: 1000, keyboard: false }).bindPopup(popup('Pickup', pickup.address)).addTo(map);
        const mB = L.marker(b, { icon: pinIcon('#dc2626', 'B'), title: 'Drop-off', zIndexOffset: 1000, keyboard: false }).bindPopup(popup('Drop-off', dropoff.address)).addTo(map);

        const fitAll = () =>
            map.fitBounds(L.latLngBounds(path).extend(a).extend(b), { paddingTopLeft: [60, 64], paddingBottomRight: [60, 56], maxZoom: 17 });
        const goTo = (pt, marker) => { map.flyTo(pt, Math.max(map.getZoom(), 16), { duration: 0.6 }); marker.openPopup(); };
        api.current = { map, vehicleMarker: null, fitAll, goPickup: () => goTo(a, mA), goDrop: () => goTo(b, mB) };
        fitAll();

        // Wheel zoom only after the rider clicks the map, so normal page scrolling is never hijacked.
        map.on('click', () => map.scrollWheelZoom.enable());
        map.on('mouseout', () => map.scrollWheelZoom.disable());

        let fitted = false;
        const ro = new ResizeObserver(() => {
            map.invalidateSize();
            if (!fitted && host.current && host.current.clientWidth > 0) { fitted = true; fitAll(); }
        });
        ro.observe(host.current);
        return () => { ro.disconnect(); map.remove(); api.current = {}; };
    }, [pickup, dropoff, path]);

    // Runs after the map effect on every rebuild, so the marker survives a rebuild and just moves otherwise.
    useEffect(() => {
        const { map, vehicleMarker } = api.current;
        if (!map) return;
        if (!Number.isFinite(vLat) || !Number.isFinite(vLng)) {
            vehicleMarker?.remove();
            api.current.vehicleMarker = null;
            return;
        }
        if (vehicleMarker) vehicleMarker.setLatLng([vLat, vLng]);
        else api.current.vehicleMarker = L.marker([vLat, vLng], { icon: vehicleIcon, title: 'Simulated vehicle', zIndexOffset: 900, keyboard: false }).addTo(map);
    }, [vLat, vLng, pickup, dropoff, path]);

    return (
        <div className={styles.frame}>
            <div ref={host} className={styles.map} role="region" aria-label="Map showing your route from pickup to drop-off" />
            <div className={styles.tools} role="group" aria-label="Map shortcuts">
                <button type="button" className={styles.tool} onClick={() => api.current.fitAll?.()}>Full route</button>
                <button type="button" className={styles.tool} onClick={() => api.current.goPickup?.()}><span className={`${styles.chip} ${styles.chipA}`}>A</span>Pickup</button>
                <button type="button" className={styles.tool} onClick={() => api.current.goDrop?.()}><span className={`${styles.chip} ${styles.chipB}`}>B</span>Drop-off</button>
            </div>
        </div>
    );
}