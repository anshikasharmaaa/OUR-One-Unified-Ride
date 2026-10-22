import Button from '../common/Button';
import Icon from '../common/Icon';
import { formatNumber } from '../../utils/format';
import styles from './admin.module.css';

export default function Pagination({ page, limit, total, onPage, disabled }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total <= limit && page === 1) return <div className={styles.pager}><span>{formatNumber(total)} {total === 1 ? 'record' : 'records'}</span></div>;
  return (
    <nav className={styles.pager} aria-label="Pagination">
      <span>Page {page} of {pages} · {formatNumber(total)} records</span>
      <div className={styles.pagerBtns}>
        <Button variant="secondary" size="sm" disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}><Icon name="chevronLeft" size={16} />Previous</Button>
        <Button variant="secondary" size="sm" disabled={disabled || page >= pages} onClick={() => onPage(page + 1)}>Next<Icon name="chevronRight" size={16} /></Button>
      </div>
    </nav>
  );
}
