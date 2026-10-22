import { useEffect, useRef, useState } from 'react';
import styles from './GoogleButton.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let scriptPromise;
const loadGsi = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => { scriptPromise = null; reject(new Error('gsi failed')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
};

/** Google's own rendered button (official branding). Falls back to an honest "unavailable" notice. */
export default function GoogleButton({ onCredential, text = 'continue_with' }) {
  const host = useRef(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [state, setState] = useState(CLIENT_ID ? 'loading' : 'unavailable');

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    let observer;
    loadGsi()
      .then(() => {
        if (cancelled || !host.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (r) => r?.credential && cb.current(r.credential),
          ux_mode: 'popup',
          auto_select: false,
        });
        const draw = () => {
          if (!host.current) return;
          const width = Math.round(Math.min(400, Math.max(200, host.current.clientWidth)));
          host.current.innerHTML = '';
          window.google.accounts.id.renderButton(host.current, { type: 'standard', theme: 'outline', size: 'large', text, shape: 'rectangular', logo_alignment: 'left', width });
        };
        draw();
        let last = host.current.clientWidth;
        observer = new ResizeObserver(() => {
          if (host.current && Math.abs(host.current.clientWidth - last) > 8) { last = host.current.clientWidth; draw(); }
        });
        observer.observe(host.current);
        setState('ready');
      })
      .catch(() => !cancelled && setState('unavailable'));
    return () => { cancelled = true; observer?.disconnect(); };
  }, [text]);

  if (state === 'unavailable') {
    return (
      <p className={styles.unavailable} role="note">
        Google sign-in is temporarily unavailable. Use your email and password instead.
      </p>
    );
  }
  return <div ref={host} className={styles.host} aria-busy={state === 'loading'} />;
}
