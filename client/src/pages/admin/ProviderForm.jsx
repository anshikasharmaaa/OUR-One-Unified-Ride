import { useEffect, useState } from 'react';
import AdminDialog from '../../components/admin/AdminDialog';
import ProviderLogo from '../../components/ride-comparison/ProviderLogo';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../services/adminApi';
import { apiErrorMessage } from '../../utils/errors';
import { VEHICLE_OPTIONS } from '../../config/site';
import adm from '../../components/admin/admin.module.css';
import styles from './AdminProviders.module.css';

const CATS = VEHICLE_OPTIONS.filter((v) => v.value !== 'ANY').map((v) => ({ value: v.value.toLowerCase(), label: v.label }));
const BLANK = { name: '', slug: '', logoUrl: '', websiteUrl: '', categories: [], active: true };
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);

export default function ProviderForm({ open, provider, onClose, onSaved }) {
    const toast = useToast();
    const edit = Boolean(provider);
    const [v, setV] = useState(BLANK);
    const [slugTouched, setSlugTouched] = useState(false);
    const [errs, setErrs] = useState({});
    const [formErr, setFormErr] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        setV(provider ? { name: provider.name, slug: provider.slug, logoUrl: provider.logoUrl || '', websiteUrl: provider.websiteUrl || '', categories: provider.categories, active: provider.active } : BLANK);
        setSlugTouched(false); setErrs({}); setFormErr('');
    }, [open, provider]);

    const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
    const toggleCat = (c) => setV((s) => ({ ...s, categories: s.categories.includes(c) ? s.categories.filter((x) => x !== c) : [...s.categories, c] }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setErrs({}); setFormErr('');
        const body = { name: v.name.trim(), logoUrl: v.logoUrl.trim(), websiteUrl: v.websiteUrl.trim(), categories: v.categories, active: v.active, ...(edit ? {} : { slug: v.slug.trim().toLowerCase() }) };
        try {
            if (edit) await adminApi.updateProvider(provider.id, body); else await adminApi.createProvider(body);
            toast.success(edit ? 'Provider updated.' : 'Provider added.');
            onSaved();
            onClose();
        } catch (err) {
            const list = err?.response?.data?.errors;
            if (Array.isArray(list)) setErrs(Object.fromEntries(list.filter((x) => x.field).map((x) => [x.field, x.message])));
            setFormErr(apiErrorMessage(err));
        } finally { setBusy(false); }
    };

    const field = (k, label, props = {}, help) => (
        <div className={adm.field}>
            <label htmlFor={`pf-${k}`}>{label}</label>
            <input id={`pf-${k}`} className={adm.input} value={v[k]} onChange={set(k)} aria-invalid={Boolean(errs[k])} {...props} />
            {errs[k] ? <span className={adm.fieldErr}>{errs[k]}</span> : help && <span className={adm.help}>{help}</span>}
        </div>
    );

    return (
        <AdminDialog open={open} onClose={onClose} title={edit ? `Edit ${provider.name}` : 'Add provider'}>
            <form onSubmit={submit} className={styles.form} noValidate>
                {field('name', 'Provider name', { maxLength: 60, autoComplete: 'off', onChange: (e) => { const name = e.target.value; setV((s) => ({ ...s, name, ...(!edit && !slugTouched ? { slug: slugify(name) } : {}) })); } })}
                {field('slug', 'Identifier', { maxLength: 30, disabled: edit, autoComplete: 'off', onChange: (e) => { setSlugTouched(true); setV((s) => ({ ...s, slug: e.target.value.toLowerCase() })); } }, edit ? 'The identifier cannot be changed.' : 'Lowercase letters, numbers and hyphens. Must be unique.')}
                {field('logoUrl', 'Logo (public)', { maxLength: 300, placeholder: 'https://… or /assets/providers/name.svg', inputMode: 'url' }, 'Use the provider’s official logo and respect its brand terms. OUR never downloads this URL on the server.')}
                {v.logoUrl.trim() && !errs.logoUrl && <div className={styles.preview}><ProviderLogo id={v.slug || 'x'} name={v.name || 'Provider'} src={v.logoUrl.trim()} /> Preview</div>}
                {field('websiteUrl', 'Website (public)', { maxLength: 300, placeholder: 'https://…', inputMode: 'url' }, 'Shown for reference only. It does not create a redirect or an integration.')}
                <fieldset className={adm.field} style={{ border: 0, padding: 0, margin: 0 }}>
                    <legend>Ride categories</legend>
                    <div className={styles.checks}>
                        {CATS.map((c) => <label key={c.value}><input type="checkbox" checked={v.categories.includes(c.value)} onChange={() => toggleCat(c.value)} />{c.label}</label>)}
                    </div>
                    <span className={adm.help}>{provider?.builtIn ? 'Leave all unticked to use the provider’s default categories. Ticked categories restrict what riders see.' : 'Informational for providers without a fare integration.'}</span>
                </fieldset>
                {edit && <label className={styles.checks}><span><input type="checkbox" checked={v.active} onChange={(e) => setV((s) => ({ ...s, active: e.target.checked }))} /> Active (shown to riders where supported)</span></label>}
                {formErr && <p className={styles.formErr} role="alert">{formErr}</p>}
                <div className={styles.foot}>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
                    <Button type="submit" loading={busy}>{edit ? 'Save changes' : 'Add provider'}</Button>
                </div>
            </form>
        </AdminDialog>
    );
}