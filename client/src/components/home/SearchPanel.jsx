import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../common/Alert';
import Icon from '../common/Icon';
import PlaceInput from '../compare/PlaceInput';
import LoginRequiredModal from '../compare/LoginRequiredModal';
import LocationPermissionModal from '../compare/LocationPermissionModal';
import SavedPlacesPicker from './SavedPlacesPicker';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { comparisonService, mapsService } from '../../services/comparisonService';
import { apiErrorMessage } from '../../utils/errors';
import { clearDraft, loadDraft, saveDraft } from '../../utils/compareDraft';
import { getBestPosition } from '../../utils/geolocate';
import { VEHICLE_OPTIONS } from '../../config/site';
import styles from './SearchPanel.module.css';

const EMPTY = { text: '', place: null };
const MAX_ACCURACY_M = 3000; // rougher than this is IP-level guessing, not a usable pickup
const WARN_ACCURACY_M = 300;
const MANUAL_KEY = 'our:geo-manual';
const manualChosen = () => { try { return sessionStorage.getItem(MANUAL_KEY) === '1'; } catch { return false; } };
const rememberManual = () => { try { sessionStorage.setItem(MANUAL_KEY, '1'); } catch { /* we will just ask again */ } };
const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
const geoMessage = (code) => (
  code === 1 ? 'Location permission is blocked. You can enter your pickup manually, or allow location in your browser settings.'
    : code === 3 ? 'Finding your location took too long. Try again, or enter it manually.'
      : code === 0 ? 'This browser can’t share your location. Please enter your pickup manually.'
        : 'Your location isn’t available right now. Please enter your pickup manually.'
);

/**
 * Flow: signed-in rider opens the form with no pickup -> location popup (every time) -> best GPS fix -> reverse geocode ->
 * pickup filled only if it is a real street-level address -> debounced drop-off suggestions -> Compare -> /compare-rides/:id.
 * Saved places (with a real location) can be dropped into either field from the "Saved places" row.
 * Not signed in -> login popup (locations saved). `tone="dark"` = glass fields for dark backgrounds.
 */
export default function SearchPanel({ initial = {}, showVehicle = false, buttonLabel = 'Compare rides', idPrefix = 'hero', tone = 'light' }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { status, user } = useAuth();
  const draft = useRef(loadDraft()).current;
  const [pickup, setPickup] = useState(() => draft?.pickup || { ...EMPTY, text: initial.pickup || '' });
  const [dropoff, setDropoff] = useState(() => draft?.dropoff || { ...EMPTY, text: initial.dropoff || '' });
  const [vehicle, setVehicle] = useState(draft?.vehicleType || initial.vehicleType || 'ANY');
  const [errors, setErrors] = useState({ pickup: '', dropoff: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState('');
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState('');
  const pickRef = useRef(null);
  const dropRef = useRef(null);
  const promptedOnce = useRef(false);
  const compareAfterGeo = useRef(false);

  const isRider = status === 'authenticated' && user?.role === 'USER';
  const persist = () => saveDraft({ pickup, dropoff, vehicleType: vehicle });
  const askLogin = () => { persist(); setModal('login'); };
  const swap = () => { setPickup(dropoff); setDropoff(pickup); setErrors({ pickup: '', dropoff: '' }); };
  // The modal restores focus to its opener when it closes, so our focus call has to run after that.
  const focusLater = (ref) => setTimeout(() => ref.current?.focus(), 80);

  // A saved place goes through the same state a suggestion from the autocomplete does, so it is compared like any other place.
  const pickSaved = (kind, place) => {
    const next = { text: place.address, place };
    setFormError('');
    if (kind === 'pickup') { setPickup(next); setErrors((e) => ({ ...e, pickup: '' })); setGeoError(''); }
    else { setDropoff(next); setErrors((e) => ({ ...e, dropoff: '' })); }
  };

  async function attempt({ skipGeo = false, pickupOverride } = {}) {
    if (busy) return; // prevents duplicate submissions
    setFormError('');
    if (status === 'loading') return;
    if (status !== 'authenticated') { askLogin(); return; }
    if (user.role !== 'USER') { setFormError('Ride comparison is for rider accounts. Please log in with a rider account.'); return; }

    const p = pickupOverride || pickup;
    if (!skipGeo && !p.place && !p.text.trim() && !manualChosen()) { compareAfterGeo.current = true; setModal('geo'); return; }

    const next = {
      pickup: p.place ? '' : p.text.trim() ? 'Choose a pickup from the suggestions.' : 'Enter a pickup location.',
      dropoff: dropoff.place ? '' : dropoff.text.trim() ? 'Choose a drop-off from the suggestions.' : 'Enter a drop-off location.',
    };
    setErrors(next);
    if (next.pickup || next.dropoff) return;

    setBusy(true);
    try {
      const data = await comparisonService.create({ pickup: p.place, dropoff: dropoff.place, vehicleType: vehicle });
      clearDraft();
      navigate(`/compare-rides/${data.id}`);
    } catch (err) {
      if (err.response?.status === 401) { toast.info('Your session expired. Please log in again.'); askLogin(); }
      else setFormError(apiErrorMessage(err, 'We could not compare rides right now. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  // Browser geolocation runs only from here, i.e. only after the rider pressed "Use My Current Location" in the popup.
  async function locate({ auto }) {
    if (geoBusy) return;
    setGeoError('');
    setGeoBusy(true);

    let pos;
    try {
      pos = await getBestPosition();
    } catch (err) {
      setGeoBusy(false);
      if (err?.code === 1) { /* blocked in the browser: the popup stays open with the explanation */ }
      setGeoError(geoMessage(err?.code));
      return;
    }

    const acc = Math.round(pos.coords.accuracy || 0);
    if (acc > MAX_ACCURACY_M) {
      setGeoBusy(false);
      setGeoError(`Your device could only place you within about ${fmtDist(acc)}, which is too rough for a pickup. Please type your pickup (a phone with GPS is much more precise).`);
      return;
    }

    try {
      const r = await mapsService.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setModal('');
      setGeoBusy(false);

      if (r.precision === 'area') {
        // Only the neighbourhood is known: do not pretend it is an exact pickup. Pre-fill the area as a search and let the rider pick the spot.
        setPickup({ text: r.address.split(',')[0].trim(), place: null });
        setErrors((e) => ({ ...e, pickup: '' }));
        setGeoError(`We could only find your area. Choose your exact pickup from the suggestions.`);
        focusLater(pickRef);
        return;
      }

      const place = { placeId: r.placeId, address: r.address, lat: r.lat, lng: r.lng }; // the real GPS fix
      const filled = { text: r.address, place };
      setPickup(filled);
      setErrors((e) => ({ ...e, pickup: '' }));
      if (acc > WARN_ACCURACY_M) toast.info(`Your location is accurate to about ${fmtDist(acc)}. Please check the pickup address.`);
      else if (!(auto && dropoff.place)) toast.info('Pickup set to your current location.');
      if (auto && dropoff.place) attempt({ skipGeo: true, pickupOverride: filled });
      else if (!dropoff.place) focusLater(dropRef);
    } catch (err) {
      setGeoBusy(false);
      setGeoError(apiErrorMessage(err, 'We found your location but could not turn it into an address. Please enter your pickup manually.'));
    }
  }

  // Signed-in rider opens the form with no pickup: always ask before using the location. Runs once per mount.
  useEffect(() => {
    if (promptedOnce.current || !isRider || pickup.place || manualChosen()) return;
    promptedOnce.current = true;
    compareAfterGeo.current = false;
    setModal('geo');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRider]);

  const onLocateButton = () => {
    if (!isRider) { askLogin(); return; }
    compareAfterGeo.current = false;
    setModal('geo');
  };
  const manual = () => {
    rememberManual();
    setModal('');
    setGeoError('');
    if (compareAfterGeo.current) attempt({ skipGeo: true });
    else focusLater(pickRef);
  };
  const closeGeo = () => { setModal(''); setGeoError(''); };

  return (
    <>
      <form className={`${styles.panel} ${tone === 'dark' ? styles.dark : ''}`} onSubmit={(e) => { e.preventDefault(); attempt(); }} noValidate aria-label="Compare rides">
        {formError && <Alert variant="error">{formError}</Alert>}
        <div className={styles.fields}>
          <PlaceInput
            id={`${idPrefix}-pickup`} inputRef={pickRef} tone={tone} icon="target" placeholder="Pickup location" value={pickup.text} place={pickup.place}
            onChange={(text) => { setPickup({ text, place: null }); setErrors((e) => ({ ...e, pickup: '' })); setGeoError(''); }}
            onSelect={(place) => { setPickup({ text: place.address, place }); setErrors((e) => ({ ...e, pickup: '' })); setGeoError(''); }}
            error={errors.pickup || (modal !== 'geo' ? geoError : '')} onLocate={onLocateButton}
          />
          <button type="button" className={styles.swap} onClick={swap} aria-label="Swap pickup and drop-off locations"><Icon name="swap" size={16} /></button>
          <PlaceInput
            id={`${idPrefix}-dropoff`} inputRef={dropRef} tone={tone} icon="pin" placeholder="Drop-off location" value={dropoff.text} place={dropoff.place}
            onChange={(text) => { setDropoff({ text, place: null }); setErrors((e) => ({ ...e, dropoff: '' })); }}
            onSelect={(place) => { setDropoff({ text: place.address, place }); setErrors((e) => ({ ...e, dropoff: '' })); }}
            error={errors.dropoff}
          />
        </div>

        {isRider && <SavedPlacesPicker tone={tone} onPick={pickSaved} />}

        {showVehicle && (
          <fieldset className={styles.vehicles}>
            <legend className="visually-hidden">Ride type</legend>
            <div className={styles.chips}>
              {VEHICLE_OPTIONS.map((o) => (
                <label key={o.value} className={`${styles.vchip} ${vehicle === o.value ? styles.on : ''}`}>
                  <input type="radio" name={`${idPrefix}-vehicle`} value={o.value} checked={vehicle === o.value} onChange={() => setVehicle(o.value)} className="visually-hidden" />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <button type="submit" className={styles.go} disabled={busy} aria-busy={busy || undefined}>
          {busy ? 'Finding your route…' : buttonLabel}<Icon name="arrowRight" size={18} />
        </button>
      </form>

      <LoginRequiredModal open={modal === 'login'} onClose={() => setModal('')} onLogin={() => navigate('/login', { state: { from: '/' } })} onSignup={() => navigate('/signup')} />
      <LocationPermissionModal open={modal === 'geo'} busy={geoBusy} error={geoError} onUse={() => locate({ auto: compareAfterGeo.current })} onManual={manual} onClose={closeGeo} />
    </>
  );
}