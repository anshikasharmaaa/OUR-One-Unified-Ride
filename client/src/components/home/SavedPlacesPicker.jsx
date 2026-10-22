import useApi from '../../hooks/useApi';
import { accountService } from '../../services/accountService';
import { FAVORITE_LABEL } from '../../utils/profileOptions';
import styles from './SavedPlacesPicker.module.css';

/**
 * "From / To" chips for the rider's saved places that have a real location. Shows nothing while loading, when the
 * request fails, or when there is nothing usable: the search form always works without it.
 */
export default function SavedPlacesPicker({ onPick, tone = 'light' }) {
    const { data } = useApi(() => accountService.favorites());
    const places = (data?.items || []).filter((f) => f.resolved);
    if (!places.length) return null;

    return (
        <div className={`${styles.wrap} ${tone === 'dark' ? styles.dark : ''}`} role="group" aria-label="Saved places">
            <span className={styles.title}>Saved places</span>
            <ul className={styles.list}>
                {places.map((f) => {
                    const name = f.name || FAVORITE_LABEL[f.label];
                    const place = { placeId: f.placeId, address: f.address, lat: f.lat, lng: f.lng };
                    return (
                        <li key={f.id} className={styles.item}>
                            <span className={styles.name} title={f.address}>{name}</span>
                            <button type="button" className={styles.btn} onClick={() => onPick('pickup', place)} aria-label={`Use ${name} as pickup`}>From</button>
                            <button type="button" className={styles.btn} onClick={() => onPick('dropoff', place)} aria-label={`Use ${name} as drop-off`}>To</button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}