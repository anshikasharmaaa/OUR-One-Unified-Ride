import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import PlaceInput from '../../components/compare/PlaceInput';
import StateMessage from '../../components/admin/StateMessage';
import ProfileShell from './ProfileShell';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/accountService';
import { apiErrorMessage } from '../../utils/errors';
import { loadDraft, saveDraft } from '../../utils/compareDraft';
import { FAVORITE_LABEL } from '../../utils/profileOptions';
import styles from './Profile.module.css';
import extra from './ProfileExtras.module.css';

const BLANK = { label: 'HOME', name: '', text: '', place: null };
const small = { minHeight: 40 };

export default function Favorites() {
    const toast = useToast();
    const navigate = useNavigate();
    const { data, loading, error, reload } = useApi(() => accountService.favorites());
    const [editing, setEditing] = useState(null); // null | 'new' | id
    const [form, setForm] = useState(BLANK);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const [confirmId, setConfirmId] = useState(null);

    const open = (fav) => {
        setErr('');
        setEditing(fav ? fav.id : 'new');
        setForm(
            fav
                ? {
                    label: fav.label, name: fav.name, text: fav.address,
                    // Only a place that was really resolved can be kept as is; otherwise it must be picked again.
                    place: fav.resolved ? { placeId: fav.placeId, address: fav.address, lat: fav.lat, lng: fav.lng } : null,
                }
                : BLANK,
        );
    };
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const save = async (ev) => {
        ev.preventDefault();
        if (!form.place) { setErr('Choose the place from the suggestions so it can be used in ride searches.'); return; }
        if (form.label === 'OTHER' && !form.name.trim()) { setErr('Give this place a name.'); return; }
        setBusy(true);
        setErr('');
        try {
            const payload = {
                label: form.label, name: form.name.trim(), address: form.place.address,
                placeId: form.place.placeId, lat: form.place.lat, lng: form.place.lng,
            };
            if (editing === 'new') await accountService.addFavorite(payload); else await accountService.updateFavorite(editing, payload);
            toast.success('Place saved.');
            setEditing(null);
            reload();
        } catch (e) {
            setErr(apiErrorMessage(e, 'We could not save this place.'));
        } finally {
            setBusy(false);
        }
    };

    const remove = async (fav) => {
        setBusy(true);
        try {
            await accountService.removeFavorite(fav.id);
            toast.success('Place removed.');
            setConfirmId(null);
            reload();
        } catch (e) {
            toast.error(apiErrorMessage(e, 'We could not remove this place.'));
        } finally {
            setBusy(false);
        }
    };

    // Puts the saved place into the real search draft (the same one the search form restores) and opens the search.
    const use = (fav, kind) => {
        const place = { placeId: fav.placeId, address: fav.address, lat: fav.lat, lng: fav.lng };
        saveDraft({ ...(loadDraft() || {}), [kind]: { text: fav.address, place } });
        navigate('/');
    };

    return (
        <ProfileShell title="Favorite Locations" lead="Save the places you travel to most.">
            <div className={styles.stack}>
                <p className={styles.notice}><Icon name="pin" size={18} /><span>Use a saved place as your pickup or drop-off here, or from the “Saved places” row in the ride search.</span></p>
                {error && <div className={styles.card}><StateMessage kind="error" title="Couldn’t load your places" onRetry={reload}>{error}</StateMessage></div>}
                {loading && !data && <div className={`${styles.card} ${styles.pad}`} role="status" aria-label="Loading" style={{ minHeight: 160 }} />}

                {data && (
                    <>
                        {data.items.length === 0 && editing !== 'new' && (
                            <div className={`${styles.card} ${styles.empty}`}><strong>No saved places yet</strong><span>Add Home, Work or any place you visit often.</span></div>
                        )}
                        <ul className={styles.list}>
                            {data.items.map((f) => {
                                const name = f.name || FAVORITE_LABEL[f.label];
                                return (
                                    <li key={f.id} className={`${styles.card} ${styles.item}`}>
                                        <div className={styles.itemTop}>
                                            <span className={`${styles.chip} ${styles.tone_neutral}`}>{FAVORITE_LABEL[f.label]}</span>
                                            {!f.resolved && <span className={`${styles.chip} ${extra.chipWarn}`}>Location needed</span>}
                                        </div>
                                        <p className={styles.route}>{name}</p>
                                        <p className={styles.meta}>{f.address}</p>
                                        {!f.resolved && <p className={styles.hint}>Edit this place and pick it from the suggestions so it can be used in ride searches.</p>}
                                        <div className={extra.favBtns}>
                                            {f.resolved && (
                                                <>
                                                    <button type="button" className={styles.btn} style={small} onClick={() => use(f, 'pickup')} aria-label={`Use ${name} as pickup`}>Use as pickup</button>
                                                    <button type="button" className={styles.btn} style={small} onClick={() => use(f, 'dropoff')} aria-label={`Use ${name} as drop-off`}>Use as drop-off</button>
                                                </>
                                            )}
                                            <button type="button" className={styles.btnGhost} style={small} onClick={() => open(f)} aria-label={`Edit ${name}`}>Edit</button>
                                            {confirmId === f.id ? (
                                                <span className={extra.confirm}>
                                                    Remove this place?
                                                    <button type="button" className={styles.btnDanger} style={small} onClick={() => remove(f)} disabled={busy}>{busy ? 'Removing…' : 'Yes, remove'}</button>
                                                    <button type="button" className={styles.btnGhost} style={small} onClick={() => setConfirmId(null)} disabled={busy}>Keep</button>
                                                </span>
                                            ) : (
                                                <button type="button" className={styles.btnGhost} style={small} onClick={() => setConfirmId(f.id)} aria-label={`Remove ${name}`}>Remove</button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        {editing ? (
                            <form className={`${styles.card} ${styles.pad} ${styles.form}`} onSubmit={save} noValidate>
                                <h2 className={styles.sectionTitle}>{editing === 'new' ? 'Add a place' : 'Edit place'}</h2>
                                <div className={styles.field}>
                                    <label htmlFor="fv-label">Label</label>
                                    <select id="fv-label" value={form.label} onChange={set('label')}>
                                        {Object.entries(FAVORITE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label htmlFor="fv-name">Name {form.label !== 'OTHER' && '(optional)'}</label>
                                    <input id="fv-name" value={form.name} onChange={set('name')} maxLength={60} placeholder="e.g. Mom’s house" />
                                </div>
                                <div className={extra.placeField}>
                                    <label htmlFor="fv-place" className={extra.placeLabel}>Place</label>
                                    <PlaceInput
                                        id="fv-place" icon="pin" placeholder="Search for the place" value={form.text} place={form.place}
                                        onChange={(text) => { setForm((f) => ({ ...f, text, place: null })); setErr(''); }}
                                        onSelect={(place) => { setForm((f) => ({ ...f, text: place.address, place })); setErr(''); }}
                                    />
                                </div>
                                {err && <p className={styles.err} role="alert">{err}</p>}
                                <div className={styles.actions}>
                                    <button type="submit" className={styles.btn} disabled={busy}>{busy ? 'Saving…' : 'Save place'}</button>
                                    <button type="button" className={styles.btnGhost} onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className={styles.actions}>
                                <button type="button" className={styles.btn} onClick={() => open(null)} disabled={data.items.length >= data.max}><Icon name="pin" size={16} />Add a place</button>
                                {data.items.length >= data.max && <span className={styles.hint}>You’ve reached the limit of {data.max} places.</span>}
                            </div>
                        )}
                    </>
                )}
            </div>
        </ProfileShell>
    );
}