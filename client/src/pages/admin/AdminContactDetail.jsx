import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Panel from '../../components/admin/Panel';
import Badge from '../../components/admin/Badge';
import StateMessage from '../../components/admin/StateMessage';
import Button from '../../components/common/Button';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../services/adminApi';
import { apiErrorMessage } from '../../utils/errors';
import { formatDateTime } from '../../utils/format';
import { STATUS_LABEL, STATUS_TONE, REPLY_LABEL, REPLY_TONE } from './contactMeta';
import adm from '../../components/admin/admin.module.css';
import styles from './AdminContacts.module.css';

const newId = () => (globalThis.crypto?.randomUUID?.() ?? `r${Date.now()}${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);

export default function AdminContactDetail() {
    const { id } = useParams();
    const toast = useToast();
    const { data, loading, error, reload } = useApi(() => adminApi.contact(id), [id]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const [statusBusy, setStatusBusy] = useState(false);
    const requestId = useRef(newId()); // same id across retries of one reply, so a retry can never send twice
    const q = data?.query;

    const setStatus = async (status) => {
        setStatusBusy(true);
        try { await adminApi.setContactStatus(id, status); toast.success(`Marked ${STATUS_LABEL[status].toLowerCase()}.`); reload(); }
        catch (err) { toast.error(apiErrorMessage(err)); }
        finally { setStatusBusy(false); }
    };

    const send = async (e) => {
        e.preventDefault();
        if (sending || text.trim().length < 5) return;
        setSending(true);
        setSendError('');
        try {
            await adminApi.replyContact(id, { message: text.trim(), requestId: requestId.current });
            toast.success('Reply sent. The query is resolved.');
            setText('');
            requestId.current = newId();
        } catch (err) {
            setSendError(apiErrorMessage(err, 'The reply could not be sent.')); // text and request id are kept so the admin can retry
        } finally {
            setSending(false);
            reload();
        }
    };

    if (loading && !q) return <Panel><StateMessage title="Loading query…" /></Panel>;
    if (error && !q) return <Panel><StateMessage kind="error" title="Couldn’t load this query" onRetry={reload}>{error}</StateMessage></Panel>;
    if (!q) return null;

    const statusAction = q.status === 'OPEN' ? ['IN_PROGRESS', 'Start handling'] : q.status === 'IN_PROGRESS' ? ['OPEN', 'Mark as open'] : ['OPEN', 'Reopen'];

    return (
        <>
            <p><Link to="/admin/contacts">← All queries</Link></p>
            <div className={styles.cols}>
                <div className={styles.stack}>
                    <Panel
                        title={`${q.ticketId} · ${q.subject}`} id="query-msg"
                        action={<span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}><Badge tone={STATUS_TONE[q.status]}>{STATUS_LABEL[q.status]}</Badge><Button size="sm" variant="secondary" loading={statusBusy} onClick={() => setStatus(statusAction[0])}>{statusAction[1]}</Button></span>}
                    >
                        <p className={styles.msg}>{q.message}</p>
                    </Panel>

                    <Panel title="Reply history" id="query-replies">
                        {q.replies.length === 0 ? <p className={adm.statHint}>No replies yet. The original message above is never changed.</p> : (
                            <div className={styles.stack}>
                                {q.replies.map((r) => (
                                    <div key={r.id} className={styles.reply}>
                                        <div className={styles.replyTop}>
                                            <span>{r.adminName} · {formatDateTime(r.sentAt || r.createdAt)}</span>
                                            <Badge tone={REPLY_TONE[r.state]}>{REPLY_LABEL[r.state]}</Badge>
                                        </div>
                                        <p className={styles.msg}>{r.message}</p>
                                        {r.state === 'FAILED' && <p className={styles.err}>Delivery failed{r.error ? ` (${r.error})` : ''}. The query stays unresolved. Send again below.</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="Reply by email" id="query-compose">
                        <form onSubmit={send} className={styles.stack} noValidate>
                            <div className={adm.field}>
                                <label htmlFor="reply-text">Your reply to {q.name} ({q.email})</label>
                                <textarea id="reply-text" className={adm.textarea} value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} placeholder="Write a clear, friendly answer…" disabled={sending} />
                                <span className={adm.help}>{text.length} / 5000 · Sending emails this to the person and marks the query resolved only once the mail server accepts it.</span>
                            </div>
                            {sendError && <p className={styles.err} role="alert">{sendError}</p>}
                            <div className={styles.actions}>
                                <span className={adm.help}>{q.status === 'RESOLVED' ? 'This query is resolved. A further reply is sent as a follow-up.' : 'Opens as “Resolved” after a successful send.'}</span>
                                <Button type="submit" loading={sending} disabled={sending || text.trim().length < 5}>Send reply</Button>
                            </div>
                        </form>
                    </Panel>
                </div>

                <Panel title="Sender" id="query-sender">
                    <dl className={styles.meta}>
                        <div><dt>Name</dt><dd>{q.name}</dd></div>
                        <div><dt>Email</dt><dd><a href={`mailto:${q.email}`}>{q.email}</a></dd></div>
                        <div><dt>Phone</dt><dd>{q.phone || 'Not provided'}</dd></div>
                        <div><dt>Organisation</dt><dd>{q.organisation || 'Not provided'}</dd></div>
                        <div><dt>Submitted</dt><dd>{formatDateTime(q.createdAt)}</dd></div>
                        <div><dt>Last updated</dt><dd>{formatDateTime(q.updatedAt)}</dd></div>
                        {q.resolvedAt && <div><dt>Resolved</dt><dd>{formatDateTime(q.resolvedAt)}</dd></div>}
                    </dl>
                </Panel>
            </div>
        </>
    );
}