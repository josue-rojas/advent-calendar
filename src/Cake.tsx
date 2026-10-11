import { CSSProperties, KeyboardEvent } from 'react';
import './Cake.css';
import { RunwayDay, startOfDay } from './dates';

const WAX = ['#f7b6c8', '#ffd2b0', '#fbe9a6', '#bfe6c9', '#b5d8f2', '#d3c3f0'];

// Geometry (SVG user units, viewBox 0 0 360 300). The cake top is an ellipse centered at (180, 120).
const CX = 180;
const TOP_Y = 120;
const RX = 160;
const RY = 46;
const PER_ROW = 10;
// Three rows of ten candles: back, middle, front. Rows nearer the front are a touch bigger.
const ROWS = [
  { y: 100, half: 112, scale: 0.9 },
  { y: 120, half: 128, scale: 0.96 },
  { y: 142, half: 112, scale: 1 },
];

function slot(n: number) {
  const row = Math.floor((n - 1) / PER_ROW);
  const col = (n - 1) % PER_ROW;
  const { y, half, scale } = ROWS[row];
  return { x: CX - half + (2 * half * col) / (PER_ROW - 1), y, scale };
}

function rimY(x: number) {
  const t = (x - CX) / RX;
  return TOP_Y + RY * Math.sqrt(Math.max(0, 1 - t * t));
}

// Static decoration, computed once.
const DRIPS = [48, 84, 122, 160, 200, 238, 276, 312].map((x, i) => ({ x, h: 14 + ((i * 7) % 5) * 5 }));
const DOTS: { x: number; y: number; c: number }[] = [];
[176, 200, 224].forEach((y, r) => {
  for (let i = 0; i < 10; i++) {
    DOTS.push({ x: 40 + i * 31 + (r % 2 ? 15 : 0), y, c: (i + r) % WAX.length });
  }
});

interface CakeProps {
  days: RunwayDay[];
  /** Candles for days up to and including this date are on the cake */
  through: Date;
  /** Dec 2 or later (or ?finale): every candle is on the cake and can be lit */
  finale: boolean;
  lit: boolean;
  /** dateKey of the day being shown above the cake */
  currentKey: string;
  onSelect: (day: RunwayDay) => void;
}

function Cake({ days, through, finale, lit, currentKey, onSelect }: CakeProps) {
  const isPresent = (day: RunwayDay) => finale || startOfDay(day.date) <= startOfDay(through);
  const count = days.filter(isPresent).length;


  let status: string;
  if (lit) status = 'Make a wish.';
  else if (finale) status = 'All thirty candles are here.';
  else if (count === 0) status = 'The first candle goes on the cake on November 2. They stay unlit until December 2.';
  else status = `${count} of ${days.length} candles are on the cake. They stay unlit until December 2.`;

  const onKey = (e: KeyboardEvent, day: RunwayDay) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(day);
    }
  };

  return (
    <div className={`cake ${lit ? 'lit' : ''}`}>
      <svg viewBox="0 0 360 300" role="group" aria-label="Birthday cake with candles">
        {/* plate */}
        <ellipse cx={CX} cy={262} rx={176} ry={30} className="plate" />
        <ellipse cx={CX} cy={258} rx={176} ry={30} className="plateRim" />

        {/* cake body */}
        <path className="sponge" d={`M${CX - RX} ${TOP_Y} V238 A${RX} ${RY} 0 0 0 ${CX + RX} 238 V${TOP_Y} Z`} />
        {DOTS.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={4} style={{ fill: WAX[d.c] }} className="dot" />
        ))}

        {/* frosting: drips, then the top */}
        {DRIPS.map((d) => (
          <rect key={d.x} x={d.x - 10} y={rimY(d.x) - 6} width={20} height={d.h + 6} rx={10} className="frosting" />
        ))}
        <ellipse cx={CX} cy={TOP_Y} rx={RX} ry={RY} className="frosting" />
        <ellipse cx={CX} cy={TOP_Y} rx={RX} ry={RY} className="frostingEdge" />

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
              <ellipse className="hole" cx={0} cy={0} rx={5} ry={2} />
              {current && <ellipse className="currentRing" cx={0} cy={0} rx={9} ry={3.4} />}
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
              {present && (
                <g
                  className="candleHit"
                  role="button"
                  tabIndex={0}
                  aria-label={`Day ${day.n}`}
                  onClick={() => onSelect(day)}
                  onKeyDown={(e) => onKey(e, day)}
                >
                  <rect x={-12} y={-66} width={24} height={72} />
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <p className="cakeStatus">{status}</p>
    </div>
  );
}

export default Cake;
