import styles from './admin.module.css';
export default function Panel({ title, action, children, flush = false, id }) {
  return (
    <section className={styles.panel} aria-labelledby={id}>
      {(title || action) && (
        <div className={styles.panelHead}>
          {title && <h2 id={id}>{title}</h2>}
          {action}
        </div>
      )}
      <div className={flush ? styles.flush : styles.panelBody}>{children}</div>
    </section>
  );
}
