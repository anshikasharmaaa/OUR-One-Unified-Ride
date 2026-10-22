import { useState } from 'react';
import Panel from '../../components/admin/Panel';
import Badge from '../../components/admin/Badge';
import DataTable from '../../components/admin/DataTable';
import Button from '../../components/common/Button';
import ProviderLogo from '../../components/ride-comparison/ProviderLogo';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../services/adminApi';
import { apiErrorMessage } from '../../utils/errors';
import { formatDateTime } from '../../utils/format';
import { VEHICLE_LABEL } from '../../config/site';
import ProviderForm from './ProviderForm';
import styles from './AdminProviders.module.css';

const catText = (p) => (p.categories.length ? p.categories : p.defaultCategories).map((c) => VEHICLE_LABEL[c.toUpperCase()] || c).join(', ') || '—';

export default function AdminProviders() {
    const toast = useToast();
    const { data, loading, error, reload } = useApi(() => adminApi.providers());
    const [dialog, setDialog] = useState({ open: false, provider: null });
    const [busy, setBusy] = useState('');

    const run = async (key, fn, ok) => {
        setBusy(key);
        try { await fn(); toast.success(ok); reload(); } catch (err) { toast.error(apiErrorMessage(err)); } finally { setBusy(''); }
    };
    const toggle = (p) => {
        if (p.active && !window.confirm(`Deactivate ${p.name}? Riders will stop seeing it on the comparison page.`)) return;
        run(p.id, () => adminApi.updateProvider(p.id, { active: !p.active }), p.active ? `${p.name} deactivated.` : `${p.name} activated.`);
    };
    const remove = (p) => {
        if (!window.confirm(`Delete ${p.name}? This cannot be undone.`)) return;
        run(p.id, () => adminApi.deleteProvider(p.id), `${p.name} deleted.`);
    };

    const columns = [
        {
            key: 'p', header: 'Provider', render: (p) => (
                <span className={styles.who}><ProviderLogo id={p.slug} name={p.name} src={p.logoUrl} /><span>{p.name}<span className={styles.slug} style={{ display: 'block' }}>{p.slug}</span></span></span>
            )
        },
        { key: 'c', header: 'Ride categories', render: (p) => catText(p) },
        { key: 'i', header: 'Integration', render: (p) => <><Badge tone={p.integration.tone}>{p.integration.label}</Badge><span className={styles.note}>{p.integration.note}</span></> },
        { key: 's', header: 'Status', render: (p) => <Badge tone={p.active ? 'good' : 'neutral'}>{p.active ? 'Active' : 'Inactive'}</Badge> },
        { key: 'u', header: 'Updated', nowrap: true, render: (p) => formatDateTime(p.updatedAt) },
        {
            key: 'a', header: 'Actions', render: (p) => (
                <span className={styles.actions}>
                    <Button size="sm" variant="secondary" onClick={() => setDialog({ open: true, provider: p })}>Edit</Button>
                    <Button size="sm" variant="secondary" loading={busy === p.id} disabled={Boolean(busy)} onClick={() => toggle(p)}>{p.active ? 'Deactivate' : 'Activate'}</Button>
                    {!p.builtIn && <Button size="sm" variant="secondary" disabled={Boolean(busy)} onClick={() => remove(p)} aria-label={`Delete ${p.name}`}>Delete</Button>}
                </span>
            )
        },
    ];

    return (
        <>
            <p className={styles.banner}>These are providers OUR <strong>compares</strong>. Listing one does not imply a partnership with it or a live fare integration, and adding a record does not create one.</p>
            <Panel
                title="Providers" id="providers" flush
                action={<Button size="sm" onClick={() => setDialog({ open: true, provider: null })}>Add Provider</Button>}
            >
                <DataTable caption="Providers" columns={columns} rows={data?.items} loading={loading} error={error} onRetry={reload} emptyTitle="No providers" emptyText="Add a provider to list it here." skeletonRows={3} />
            </Panel>
            <ProviderForm open={dialog.open} provider={dialog.provider} onClose={() => setDialog({ open: false, provider: null })} onSaved={reload} />
        </>
    );
}