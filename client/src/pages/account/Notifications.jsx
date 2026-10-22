import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/admin/Pagination';
import StateMessage from '../../components/admin/StateMessage';
import ProfileShell from './ProfileShell';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/accountService';
import { apiErrorMessage } from '../../utils/errors';
import { formatDateTime } from '../../utils/format';
import styles from './Profile.module.css';

const LIMIT = 10;

export default function Notifications() {
    const toast = useToast();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [onlyUnread, setOnlyUnread] = useState(false);
    const { data, loading, error, reload } = useApi(() => accountService.notifications(page, LIMIT, onlyUnread ? 'true' : undefined), [page, onlyUnread]);

    const open = async (n) => {
        try {
            if (!n.read) await accountService.markRead(n.id);
        } catch (e) {
            toast.error(apiErrorMessage(e, 'Could not mark this as read.'));
            return;
        }
        if (n.link && n.link.startsWith('/')) navigate(n.link); else reload();
    };
    const readAll = async () => {
        try {
            await accountService.markAllRead();
            reload();
        } catch (e) {
            toast.error(apiErrorMessage(e, 'Could not mark notifications as read.'));
        }
    };

    return (
        <ProfileShell title="Notifications" lead="Updates about your account and activity. These appear here only; no email or SMS is sent.">
            <div className={styles.stack}>
                <div className={styles.itemTop}>
                    <div className={styles.tabs} role="group" aria-label="Filter notifications">
                        <button type="button" className={`${styles.tab} ${!onlyUnread ? styles.tabOn : ''}`} aria-pressed={!onlyUnread} onClick={() => { setPage(1); setOnlyUnread(false); }}>All</button>
                        <button type="button" className={`${styles.tab} ${onlyUnread ? styles.tabOn : ''}`} aria-pressed={onlyUnread} onClick={() => { setPage(1); setOnlyUnread(true); }}>Unread{data ? ` (${data.unreadCount})` : ''}</button>
                    </div>
                    <button type="button" className={styles.btnGhost} style={{ minHeight: 40 }} onClick={readAll} disabled={!data || data.unreadCount === 0}>Mark all as read</button>
                </div>

                {error && <div className={styles.card}><StateMessage kind="error" title="Couldn’t load notifications" onRetry={reload}>{error}</StateMessage></div>}
                {loading && !data && <div className={`${styles.card} ${styles.pad}`} role="status" aria-label="Loading" style={{ minHeight: 160 }} />}
                {data && data.items.length === 0 && (
                    <div className={`${styles.card} ${styles.empty}`}><strong>{onlyUnread ? 'You’re all caught up' : 'No notifications yet'}</strong><span>Updates about your account will show up here.</span></div>
                )}
                {data && data.items.length > 0 && (
                    <ul className={styles.list} aria-busy={loading || undefined}>
                        {data.items.map((n) => (
                            <li key={n.id} className={`${styles.card} ${n.read ? '' : styles.unread}`}>
                                <button type="button" className={`${styles.itemBtn} ${styles.item}`} onClick={() => open(n)}>
                                    <span className={styles.itemTop}>
                                        <strong>{n.title}{!n.read && <span className="visually-hidden"> (unread)</span>}</strong>
                                        <time dateTime={n.createdAt} className={styles.sub}>{formatDateTime(n.createdAt)}</time>
                                    </span>
                                    {n.body && <span className={styles.meta} style={{ display: 'block', marginTop: 4 }}>{n.body}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {data && !error && <div className={styles.card}><Pagination page={page} limit={LIMIT} total={data.total} onPage={setPage} disabled={loading} /></div>}
            </div>
        </ProfileShell>
    );
}