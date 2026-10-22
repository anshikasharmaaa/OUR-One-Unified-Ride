import StateMessage from './StateMessage';
import styles from './DataTable.module.css';

/** columns: [{ key, header, render(row), nowrap }]. Handles loading, error and empty states. */
export default function DataTable({ caption, columns, rows, loading, error, onRetry, emptyTitle, emptyText, skeletonRows = 5, compact = false }) {
  if (error) return <StateMessage kind="error" title="Couldn’t load this table" onRetry={onRetry}>{error}</StateMessage>;
  if (!loading && (!rows || rows.length === 0)) return <StateMessage title={emptyTitle || 'Nothing here yet'}>{emptyText}</StateMessage>;
  return (
    <div className={styles.wrap} role="region" aria-label={caption} tabIndex={0} aria-busy={loading || undefined}>
      <table className={`${styles.table} ${compact ? styles.compact : ''}`}>
        <caption className="visually-hidden">{caption}</caption>
        <thead><tr>{columns.map((c) => <th key={c.key} scope="col">{c.header}</th>)}</tr></thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, i) => (
              <tr key={i}>{columns.map((c) => <td key={c.key}><span className={styles.skel} style={{ width: `${55 + ((i + c.key.length) % 4) * 10}%` }} /></td>)}</tr>
            ))
            : rows.map((r) => (
              <tr key={r.id}>{columns.map((c) => <td key={c.key} className={c.nowrap ? styles.nowrap : ''}>{c.render(r)}</td>)}</tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
