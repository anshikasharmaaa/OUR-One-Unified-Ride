import { useEffect, useRef } from 'react';

const LINK_DISTANCE = 120;

/** Decorative network animation. Fills its (positioned) parent; never intercepts input. */
export default function ParticleCanvas({ className }) {
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas?.getContext('2d');
        const host = canvas?.parentElement;
        if (!canvas || !ctx || !host) return undefined;

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const root = getComputedStyle(document.documentElement);
        const color = root.getPropertyValue('--c-brand-600').trim() || '#2f7bff';

        let w = 0;
        let h = 0;
        let raf = 0;
        let running = false;
        let onScreen = true;
        let particles = [];

        const lowPower = () => (navigator.hardwareConcurrency || 4) <= 4 || window.innerWidth < 640;

        const build = () => {
            const max = lowPower() ? 28 : 60;
            const count = Math.max(10, Math.min(max, Math.round((w * h) / 18000)));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                r: 1.2 + Math.random() * 1.4,
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            for (let i = 0; i < particles.length; i += 1) {
                const a = particles[i];
                ctx.globalAlpha = 0.45;
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
                ctx.fill();
                for (let j = i + 1; j < particles.length; j += 1) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d = Math.hypot(dx, dy);
                    if (d < LINK_DISTANCE) {
                        ctx.globalAlpha = (1 - d / LINK_DISTANCE) * 0.22;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
        };

        const step = () => {
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
            }
        };

        const loop = () => {
            if (!running) return;
            step();
            draw();
            raf = requestAnimationFrame(loop);
        };

        const sync = () => {
            const shouldRun = !motionQuery.matches && onScreen && !document.hidden;
            if (shouldRun && !running) {
                running = true;
                raf = requestAnimationFrame(loop);
            } else if (!shouldRun && running) {
                running = false;
                cancelAnimationFrame(raf);
            }
            if (!shouldRun) draw(); // reduced motion: a single still frame
        };

        const resize = () => {
            const rect = host.getBoundingClientRect();
            w = Math.max(1, Math.floor(rect.width));
            h = Math.max(1, Math.floor(rect.height));
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            build();
            draw();
        };

        resize();
        sync();

        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
        if (ro) ro.observe(host);
        else window.addEventListener('resize', resize);

        const io = typeof IntersectionObserver !== 'undefined'
            ? new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); })
            : null;
        if (io) io.observe(canvas);

        document.addEventListener('visibilitychange', sync);
        motionQuery.addEventListener('change', sync);

        return () => {
            running = false;
            cancelAnimationFrame(raf);
            if (ro) ro.disconnect();
            else window.removeEventListener('resize', resize);
            if (io) io.disconnect();
            document.removeEventListener('visibilitychange', sync);
            motionQuery.removeEventListener('change', sync);
        };
    }, []);

    return <canvas ref={ref} className={className} aria-hidden="true" />;
}