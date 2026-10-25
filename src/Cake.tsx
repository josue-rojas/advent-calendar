import { CSSProperties } from 'react';
import './Cake.css';
import { RunwayDay, startOfDay } from './dates';

const WAX = ['#f7b6c8', '#ffd2b0', '#fbe9a6', '#bfe6c9', '#b5d8f2', '#d3c3f0'];

// Geometry (SVG user units, viewBox 0 0 360 336). The cake top is an ellipse centered at (180, 112).
const CX = 180;
const TOP_Y = 112;
const RX = 160;
const RY = 36;
const BOTTOM_Z = 288; // height (at the cake's centerline) of the bottom edge
const PER_ROW = 10;
// Three rows of ten candles: back, middle, front. Rows nearer the front are a touch bigger.
const ROWS = [
  { y: 98, half: 108, scale: 0.9 },
  { y: 112, half: 124, scale: 0.96 },
  { y: 126, half: 108, scale: 1 },
];

function slot(n: number) {
  const row = Math.floor((n - 1) / PER_ROW);
  const col = (n - 1) % PER_ROW;
  const { y, half, scale } = ROWS[row];
  return { x: CX - half + (2 * half * col) / (PER_ROW - 1), y, scale };
}

// ---- The cake itself: a naked confetti cake (speckled sponge, thick uneven cream, crumb ring) ----

/** y of the front edge of a horizontal slice of the cylinder at height z, at x. */
function frontY(z: number, x: number) {
  const t = (x - CX) / RX;
  return z + RY * Math.sqrt(Math.max(0, 1 - t * t));
}

function wobble(x: number, seed: number, amp: number) {
  return amp * (0.55 * Math.sin(x * 0.07 + seed) + 0.3 * Math.sin(x * 0.19 + seed * 2.3) + 0.15 * Math.sin(x * 0.43 + seed * 5.1));
}

/** A band of cream between heights z1 and z2 with hand-spread, uneven edges and rounded ends. */
function bandPath(z1: number, z2: number, seed: number, ampUp: number, ampLo: number, squish: number) {
  const xs: number[] = [];
  for (let x = CX - RX - squish; x <= CX + RX + squish + 0.1; x += 4) xs.push(x);
  // Thickness eases to zero at the very ends so the cream bulges out and closes in a round cap.
  const thick = (x: number) => {
    const t = Math.min(1, Math.abs(x - CX) / (RX + squish));
    return Math.sqrt(1 - Math.pow(t, 60));
  };
  const up = xs.map((x) => `${x.toFixed(1)} ${(frontY(z1, x) + wobble(x, seed, ampUp)).toFixed(1)}`);
  const lo = xs
    .slice()
    .reverse()
    .map((x) => `${x.toFixed(1)} ${(frontY(z1 + (z2 - z1) * thick(x), x) + wobble(x, seed + 9, ampLo) * thick(x)).toFixed(1)}`);
  return `M${up.join(' L')} L${lo.join(' L')} Z`;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONFETTI = ['#e8503f', '#16a9b8', '#3b6fd6', '#f39a2b', '#f6cf3a', '#4fb872'];

interface Sprinkle { x: number; y: number; a: number; c: string; w: number; h: number }

const BODY_SPRINKLES: Sprinkle[] = (() => {
  const r = rng(30);
  const out: Sprinkle[] = [];
  for (let i = 0; i < 200; i++) {
    const x = 24 + r() * 312;
    const z = 140 + r() * (BOTTOM_Z - 142);
    out.push({ x, y: frontY(z, x), a: r() * 180, c: CONFETTI[Math.floor(r() * CONFETTI.length)], w: 1.7, h: 3.8 });
  }
  return out;
})();

const TOP_SPRINKLES: Sprinkle[] = (() => {
  const r = rng(7);
  const out: Sprinkle[] = [];
  for (let i = 0; i < 40; i++) {
    const ang = r() * Math.PI * 2;
    const k = 0.9 + r() * 0.08;
    out.push({ x: CX + Math.cos(ang) * RX * k, y: TOP_Y + Math.sin(ang) * RY * k, a: r() * 180, c: CONFETTI[Math.floor(r() * CONFETTI.length)], w: 1.7, h: 3.6 });
  }
  return out;
})();

const CRUMBS = (() => {
  const r = rng(11);
  const n = 24;
  const list = [];
  for (let i = 0; i < n; i++) {
    const ang = ((i + (r() - 0.5) * 0.5) / n) * Math.PI * 2;
    const x = CX + Math.cos(ang) * (RX - 14);
    const y = TOP_Y - 2 + Math.sin(ang) * (RY - 6);
    const rx = 9.5 + r() * 3;
    const ry = 7.5 + r() * 2.2;
    const rot = (r() - 0.5) * 50;
    const specks = [0, 1, 2].map(() => ({ dx: (r() - 0.5) * rx, dy: (r() - 0.5) * ry, c: CONFETTI[Math.floor(r() * CONFETTI.length)] }));
    list.push({ x, y, rx, ry, rot, specks });
  }
  return list.sort((a, b) => a.y - b.y); // back to front so the near crumbs overlap the far ones
})();

const LIP = bandPath(TOP_Y, 137, 1.3, 0, 2.4, 2);
const BAND_1 = bandPath(172, 196, 4.1, 2.2, 2.6, 3);
const BAND_2 = bandPath(228, 252, 7.7, 2.4, 2.6, 3);
const BODY = `M${CX - RX} ${TOP_Y} A${RX} ${RY} 0 0 0 ${CX + RX} ${TOP_Y} V${BOTTOM_Z} A${RX} ${RY} 0 0 1 ${CX - RX} ${BOTTOM_Z} Z`;

function Sprinkles({ list }: { list: Sprinkle[] }) {
  return (
    <>
      {list.map((s, i) => (
        <rect key={i} x={s.x - s.w / 2} y={s.y - s.h / 2} width={s.w} height={s.h} rx={s.w / 2} fill={s.c} transform={`rotate(${s.a.toFixed(0)} ${s.x.toFixed(1)} ${s.y.toFixed(1)})`} />
      ))}
    </>
  );
}

interface CakeProps {
  days: RunwayDay[];
  /** Candles for days up to and including this date are on the cake */
  through: Date;
  /** Dec 2 or later (or ?finale): every candle is on the cake and can be lit */
  finale: boolean;
  lit: boolean;
  /** dateKey of the day being shown above the cake */
  currentKey: string;
}

function Cake({ days, through, finale, lit, currentKey }: CakeProps) {
  const isPresent = (day: RunwayDay) => finale || startOfDay(day.date) <= startOfDay(through);

  return (
    <div className={`cake ${lit ? 'lit' : ''}`}>
      <svg viewBox="0 0 360 336" role="group" aria-label="Birthday cake with candles">
        <defs>
          <clipPath id="cakeBodyClip">
            <path d={BODY} />
          </clipPath>
          <linearGradient id="cakeSideShade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#6b4a14" stopOpacity="0.22" />
            <stop offset="0.2" stopColor="#6b4a14" stopOpacity="0" />
            <stop offset="0.8" stopColor="#6b4a14" stopOpacity="0" />
            <stop offset="1" stopColor="#6b4a14" stopOpacity="0.26" />
          </linearGradient>
          <filter id="cakeShadowBlur" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* soft shadow on the table */}
        <ellipse cx={CX - 14} cy={BOTTOM_Z + 28} rx={170} ry={17} className="shadow" filter="url(#cakeShadowBlur)" />

        {/* sponge, confetti, and side shading, clipped to the cake's silhouette */}
        <g clipPath="url(#cakeBodyClip)">
          <path d={BODY} className="sponge" />
          <Sprinkles list={BODY_SPRINKLES} />
          <rect x={CX - RX} y={TOP_Y - 2} width={RX * 2} height={BOTTOM_Z - TOP_Y + RY + 4} fill="url(#cakeSideShade)" />
        </g>

        {/* cream layers, spread unevenly so the sponge peeks through */}
        <path d={BAND_2} className="frosting" />
        <path d={BAND_1} className="frosting" />
        <path d={LIP} className="frosting" />

        {/* top of the cake */}
        <ellipse cx={CX} cy={TOP_Y} rx={RX} ry={RY} className="frosting" />
        <ellipse cx={CX} cy={TOP_Y} rx={RX} ry={RY} className="frostingEdge" />
        <Sprinkles list={TOP_SPRINKLES} />

        {/* ring of cake crumbs around the rim */}
        {CRUMBS.map((c, i) => (
          <g key={i} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${c.rot.toFixed(0)})`}>
            <ellipse cx={0} cy={0} rx={c.rx} ry={c.ry} className="crumb" />
            <ellipse cx={-c.rx * 0.25} cy={-c.ry * 0.35} rx={c.rx * 0.55} ry={c.ry * 0.35} className="crumbShine" />
            {c.specks.map((sp, j) => (
              <circle key={j} cx={sp.dx} cy={sp.dy} r={1.1} fill={sp.c} />
            ))}
          </g>
        ))}

        {/* candle holes + candles, back row to front row so rows overlap correctly */}
        {days.map((day) => {
          const { x, y, scale } = slot(day.n);
          const present = isPresent(day);
          const current = day.key === currentKey;
          // the candle for the day on screen drops onto the cake as you land on it
          const arriving = present && current;
          const vars = { '--wax': WAX[(day.n - 1) % WAX.length], '--i': day.n } as CSSProperties;
          return (
            <g key={day.key} transform={`translate(${x} ${y}) scale(${scale})`} style={vars}>
             { present && <ellipse className="hole" cx={0} cy={0} rx={5} ry={2} />}
              {present && (
                <g className={arriving ? 'arrive' : ''}>
                  <g className="flame">
                    <g className="flameWrap">
                      <path className="flameOuter" d="M0 -88 C4.5 -79 6 -72 0 -60 C-6 -72 -4.5 -79 0 -88Z" />
                      <path className="flameInner" d="M0 -78 C2.2 -74 2.5 -70 0 -64 C-2.5 -70 -2.2 -74 0 -78Z" />
                    </g>
                  </g>
                  <line className="wick" x1={0} y1={-54} x2={0} y2={-61} />
                  <path className="wax" d="M-3 -54 H3 L4.5 0 H-4.5 Z" />
                  <path className="shine" d="M-1.8 -52 H-0.4 L-1.2 -2 H-3.2 Z" />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default Cake;
