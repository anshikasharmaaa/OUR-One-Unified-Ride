// Flat vehicle illustrations drawn for OUR (original artwork, brand palette). Side view, facing right.
const NAVY = '#0f1b3d';
const TYRE = '#1b2a52';
const SKIN = '#f1c9a5';
const GLASS = '#dbe6ff';

const Wheel = ({ cx, cy, r, rim = GLASS }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={TYRE} />
    <circle cx={cx} cy={cy} r={r * 0.48} fill={rim} />
    <circle cx={cx} cy={cy} r={r * 0.14} fill={TYRE} />
  </g>
);

const Bike = () => (
  <g>
    <Wheel cx="20" cy="52" r="13" />
    <Wheel cx="80" cy="52" r="13" />
    <path d="M20 52 38 38h22l20 14" fill="none" stroke={NAVY} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M30 38h30q10 0 12 8l-2 5H36q-8 0-6-13Z" fill="#2563eb" />
    <rect x="24" y="31" width="24" height="7" rx="3.5" fill={NAVY} />
    <path d="M72 48 66 25M62 25h12" stroke={NAVY} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M52 41 40 31" stroke={NAVY} strokeWidth="6" strokeLinecap="round" />
    <path d="M38 31 45 15" stroke="#3b74f5" strokeWidth="9" strokeLinecap="round" />
    <path d="M45 19 64 26" stroke="#3b74f5" strokeWidth="5" strokeLinecap="round" />
    <circle cx="49" cy="7.5" r="6.5" fill={SKIN} />
    <path d="M42 8a7 7 0 0 1 14 0z" fill={NAVY} />
    <circle cx="75" cy="36" r="3" fill="#fff3c4" />
  </g>
);
const AutoRickshaw = () => (
  <g>
    <path d="M8 60V35h92l14 11v14z" fill="#f5b83d" />
    <path d="M12 35V17q0-9 9-9h43q8 0 12 8l13 19z" fill="#2563eb" />
    <path d="M20 33V19q0-4 4-4h38q4 0 6 4l9 14z" fill={GLASS} />
    <circle cx="37" cy="23" r="5.5" fill={SKIN} />
    <path d="M28 33q0-9 9-9t9 9z" fill={NAVY} />
    <rect x="8" y="47" width="92" height="3" fill={NAVY} opacity=".22" />
    <rect x="110" y="41" width="7" height="5" rx="2" fill="#fff3c4" />
    <Wheel cx="30" cy="61" r="12" />
    <Wheel cx="107" cy="63" r="10" />
  </g>
);
const EconomyCar = () => (
  <g>
    <path d="M6 46q0-8 8-10l16-3q8-15 24-15h26q15 0 23 14l14 4q8 2 8 10v4H6z" fill="#3b74f5" />
    <path d="M35 33q6-12 19-12h8v12zM68 21h8q11 0 17 12H68z" fill={GLASS} />
    <path d="M64 34v13" stroke="#2563eb" strokeWidth="2" />
    <rect x="125" y="37" width="6" height="5" rx="2" fill="#fff3c4" />
    <rect x="5" y="39" width="4" height="5" rx="1.5" fill="#ff7a8a" />
    <rect x="52" y="9" width="22" height="7" rx="3" fill="#f5b83d" />
    <Wheel cx="34" cy="49" r="11" />
    <Wheel cx="104" cy="49" r="11" />
  </g>
);
const PremiumCar = () => (
  <g>
    <path d="M4 43q0-6 8-8l26-5q10-13 30-13h30q20 0 33 15l18 4q8 2 8 8v4H4z" fill={NAVY} />
    <path d="M44 31q8-11 25-11h13v11zM88 20h10q15 0 25 11H88z" fill="#8fb2ff" />
    <path d="M9 42h140" stroke="#5fd6de" strokeWidth="2.5" />
    <rect x="143" y="36" width="8" height="4" rx="2" fill="#fff3c4" />
    <rect x="3" y="37" width="5" height="4" rx="1.5" fill="#ff7a8a" />
    <Wheel cx="40" cy="47" r="10" rim="#5fd6de" />
    <Wheel cx="116" cy="47" r="10" rim="#5fd6de" />
  </g>
);

export const VEHICLES = {
  bike: { w: 100, h: 66, label: 'Bike taxi', Art: Bike },
  auto: { w: 124, h: 74, label: 'Auto-rickshaw', Art: AutoRickshaw },
  economy: { w: 136, h: 60, label: 'Economy cab', Art: EconomyCar },
  premium: { w: 156, h: 58, label: 'Premium cab', Art: PremiumCar },
};

/** Standalone illustration (used in cards). Decorative unless a label is wanted. */
export function VehicleSvg({ type, className = '', labelled = false }) {
  const v = VEHICLES[type];
  return (
    <svg className={className} viewBox={`0 0 ${v.w} ${v.h}`} role={labelled ? 'img' : undefined} aria-label={labelled ? v.label : undefined} aria-hidden={labelled ? undefined : 'true'} focusable="false">
      <v.Art />
    </svg>
  );
}
