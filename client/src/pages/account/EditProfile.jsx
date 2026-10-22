import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import StateMessage from '../../components/admin/StateMessage';
import ProfileShell from './ProfileShell';
import AvatarBadge from './AvatarBadge';
import useApi from '../../hooks/useApi';
import useAvatarUrl from '../../hooks/useAvatarUrl';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/accountService';
import { apiErrorMessage } from '../../utils/errors';
import { resizeAvatar } from '../../utils/image';
import { GENDER_LABEL, AVATAR_COLORS, MOBILE_RE } from '../../utils/profileOptions';
import styles from './Profile.module.css';
import extra from './ProfileExtras.module.css';

const today = () => new Date().toISOString().slice(0, 10);

export default function EditProfile() {
    const toast = useToast();
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const { data, loading, error, reload } = useApi(() => accountService.profile());
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    // The photo is saved on its own (right after choosing it), so it never wipes what is typed in the form.
    const [photo, setPhoto] = useState({ version: 0, busy: false });
    const fileRef = useRef(null);
    const photoUrl = useAvatarUrl(photo.version);

    useEffect(() => {
        const p = data?.profile;
        if (!p) return;
        setForm({
            name: p.name, phone: p.phone || '', gender: p.gender || '', dateOfBirth: p.dateOfBirth || '',
            ecName: p.emergencyContact?.name || '', ecPhone: p.emergencyContact?.phone || '', avatarColor: p.avatarColor,
        });
        setPhoto((s) => ({ ...s, version: p.hasAvatar ? p.avatarVersion : 0 }));
    }, [data]);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // lets the same file be chosen again later
        if (!file) return;
        setPhoto((s) => ({ ...s, busy: true }));
        try {
            const blob = await resizeAvatar(file);
            const res = await accountService.uploadAvatar(blob);
            setPhoto({ version: res.profile.avatarVersion, busy: false });
            updateUser({ avatarVersion: res.profile.avatarVersion });
            toast.success('Photo updated.');
        } catch (err) {
            setPhoto((s) => ({ ...s, busy: false }));
            toast.error(err.response || err.request ? apiErrorMessage(err, 'We could not upload your photo.') : err.message);
        }
    };

    const removePhoto = async () => {
        setPhoto((s) => ({ ...s, busy: true }));
        try {
            await accountService.removeAvatar();
            setPhoto({ version: 0, busy: false });
            updateUser({ avatarVersion: 0 });
            toast.success('Photo removed.');
        } catch (err) {
            setPhoto((s) => ({ ...s, busy: false }));
            toast.error(apiErrorMessage(err, 'We could not remove your photo.'));
        }
    };

    const validate = () => {
        const e = {};
        if (form.name.trim().length < 2) e.name = 'Enter your name.';
        if (form.phone && !MOBILE_RE.test(form.phone)) e.phone = 'Enter a 10-digit mobile number.';
        if (form.dateOfBirth && form.dateOfBirth > today()) e.dateOfBirth = 'Date of birth can’t be in the future.';
        if (form.ecPhone && !MOBILE_RE.test(form.ecPhone)) e.ecPhone = 'Enter a 10-digit mobile number.';
        if (form.ecName.trim() && !form.ecPhone) e.ecPhone = 'Add a phone number for your emergency contact.';
        return e;
    };

    const submit = async (ev) => {
        ev.preventDefault();
        const found = validate();
        setErrors(found);
        if (Object.keys(found).length) return;
        setSaving(true);
        try {
            const res = await accountService.updateProfile({
                name: form.name.trim(), phone: form.phone, gender: form.gender, dateOfBirth: form.dateOfBirth,
                emergencyContact: { name: form.ecName.trim(), phone: form.ecPhone }, avatarColor: form.avatarColor,
            });
            updateUser({ name: res.profile.name, avatarColor: res.profile.avatarColor });
            toast.success('Profile updated.');
            navigate('/profile');
        } catch (err) {
            toast.error(apiErrorMessage(err, 'We could not save your profile. Please try again.'));
        } finally {
            setSaving(false);
        }
    };

    const field = (k, label, props = {}) => (
        <div className={styles.field}>
            <label htmlFor={`ep-${k}`}>{label}</label>
            <input id={`ep-${k}`} value={form[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `ep-${k}-e` : undefined} {...props} />
            {errors[k] && <span id={`ep-${k}-e`} className={styles.err}>{errors[k]}</span>}
        </div>
    );

    return (
        <ProfileShell title="Edit profile" lead="Update the details on your account. Your email can’t be changed here.">
            {loading && <div className={`${styles.card} ${styles.pad}`} role="status" aria-label="Loading" style={{ minHeight: 320 }} />}
            {error && <div className={styles.card}><StateMessage kind="error" title="Couldn’t load your profile" onRetry={reload}>{error}</StateMessage></div>}
            {form && (
                <form className={`${styles.card} ${styles.pad} ${styles.form}`} onSubmit={submit} noValidate>
                    <div className={extra.photoRow}>
                        <AvatarBadge name={form.name} color={form.avatarColor} size={88} src={photoUrl} />
                        <div className={extra.photoCol}>
                            <div className={extra.photoActions}>
                                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onFile} />
                                <button type="button" className={styles.btnGhost} style={{ minHeight: 40 }} onClick={() => fileRef.current?.click()} disabled={photo.busy || saving}>
                                    <Icon name="user" size={16} />{photo.busy ? 'Working…' : photo.version ? 'Change photo' : 'Add photo'}
                                </button>
                                {photo.version > 0 && (
                                    <button type="button" className={styles.btnGhost} style={{ minHeight: 40 }} onClick={removePhoto} disabled={photo.busy || saving}>Remove photo</button>
                                )}
                            </div>
                            <p className={styles.hint}>JPEG, PNG or WebP. Your photo is cropped to a square and shrunk on your device before it is uploaded. Photo changes save straight away.</p>
                        </div>
                    </div>

                    <fieldset className={styles.swatches} aria-label="Profile icon colour">
                        <legend className={styles.legend}>Icon colour (shown when you have no photo)</legend>
                        {AVATAR_COLORS.map((c) => (
                            <label key={c} className={styles.swatch}>
                                <input type="radio" name="avatarColor" value={c} checked={form.avatarColor === c} onChange={set('avatarColor')} aria-label={c} />
                                <span><AvatarBadge name={form.name} color={c} size={44} /></span>
                            </label>
                        ))}
                    </fieldset>

                    {field('name', 'Full name', { autoComplete: 'name', maxLength: 80 })}
                    <div className={styles.field}>
                        <label htmlFor="ep-email">Email</label>
                        <input id="ep-email" value={data.profile.email} readOnly aria-describedby="ep-email-h" />
                        <span id="ep-email-h" className={styles.hint}>Your email is your sign-in identifier, so it can’t be changed here.</span>
                    </div>
                    <div className={styles.twoCol}>
                        {field('phone', 'Phone number', { type: 'tel', inputMode: 'numeric', placeholder: '10-digit mobile number', maxLength: 10, autoComplete: 'tel-national' })}
                        <div className={styles.field}>
                            <label htmlFor="ep-gender">Gender</label>
                            <select id="ep-gender" value={form.gender} onChange={set('gender')}>
                                <option value="">Not added</option>
                                {Object.entries(GENDER_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    {field('dateOfBirth', 'Date of birth', { type: 'date', max: today(), autoComplete: 'bday' })}

                    <h2 className={styles.sectionTitle}>Emergency contact</h2>
                    <div className={styles.twoCol}>
                        {field('ecName', 'Contact name', { maxLength: 80, placeholder: 'e.g. a family member' })}
                        {field('ecPhone', 'Contact phone', { type: 'tel', inputMode: 'numeric', maxLength: 10, placeholder: '10-digit mobile number' })}
                    </div>
                    <p className={styles.hint}>Saved to your profile only. OUR does not contact this person automatically.</p>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.btn} disabled={saving || photo.busy}><Icon name="check" size={16} />{saving ? 'Saving…' : 'Save changes'}</button>
                        <button type="button" className={styles.btnGhost} onClick={() => navigate('/profile')} disabled={saving}>Cancel</button>
                    </div>
                </form>
            )}
        </ProfileShell>
    );
}