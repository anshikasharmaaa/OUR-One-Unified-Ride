import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  return true;
}

/** Router-friendly #anchor scrolling: scrolls to the hash target, or to the top on a new page. */
export default function useScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const t = setTimeout(() => scrollToId(id), 60); // wait for the page's sections to mount
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);
}
