import { useEffect, useState } from 'react';
import './App.css';
import { presents } from './presents';
import { Present } from './types';
import Cake from './Cake';
import {
  FINALE_DATE,
  RUNWAY_START,
  dateKey,
  formatLong,
  isSameDay,
  parseHash,
  presentKey,
  runwayDays,
  startOfDay,
  MONTHS,
  pad2,
} from './dates';

export type { Present } from './types';

type View = 'date' | 'note';

// On Dec 2 the candles light themselves. Wait a beat so the unlit cake is seen first, then let the
// staggered flame animation play (30 candles x 90ms) before opening the birthday note.
const LIGHT_DELAY_MS = 800;
const NOTE_AFTER_LIT_MS = 3600;

function SnowFlakes({ num, snowflake = '❅', rise = false }: { num: number; snowflake?: string; rise?: boolean }) {
  const arr = new Array(num).fill(0);

  return <div className={`snowflakes ${rise ? 'rise' : ''}`}>
    {arr.map((_, index) => {
      const left = 1 + Math.random() * 98;
      const xDelay = `${(Math.random() * 8).toFixed(1)}s`;
      const yDelay = `${(Math.random() * 4).toFixed(1)}s`;
      const fallDuration = 8 + Math.random() * 8;
      const swayDuration = 2 + Math.random() * 3;
      const size = 0.8 + Math.random() * 1.2;

      return (
        <div
          className="snowflake"
          key={`snow-${index}`}
          style={{
            left: `${left}%`,
            animationDelay: `${xDelay}, ${yDelay}`,
            animationDuration: `${fallDuration}s, ${swayDuration}s`,
            fontSize: `${size}em`,
          }}
        >
          {snowflake}
        </div>
      );
    })}
  </div>;
}

function fallbackPresent(now: Date): Present {
  if (startOfDay(now) < RUNWAY_START) {
    return { title: 'Almost time', note: `Your calendar starts on ${formatLong(RUNWAY_START)}.` };
  }
  return { title: 'No present today', note: 'Try ?preview#11.02.2026 to preview a day' };
}

const DAYS = runwayDays();

function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [view, setView] = useState<View>('date');
  const [lit, setLit] = useState(false);

  // A tag tapped (or a candle clicked) while the page is open only changes the hash.
  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash);
      setView('date');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const params = new URLSearchParams(window.location.search);
  const preview = params.has('preview');

  const parsed = parseHash(hash);
  // With ?preview the page behaves as if today were the date in the link: no real-date check,
  // so e.g. /advent-calendar/?preview#12.02.2026 plays the whole Dec 2 sequence.
  const today = preview && parsed.kind === 'date' ? parsed.date : new Date();
  const finaleMode = startOfDay(today) >= FINALE_DATE || params.has('finale');

  const date = parsed.kind === 'date' ? parsed.date : startOfDay(today);
  const key = dateKey(date);
  const isBirthday = isSameDay(date, FINALE_DATE);

  // Dec 2 (or ?finale): light the candles automatically. Back to unlit if we leave that day (preview).
  useEffect(() => {
    if (!finaleMode) {
      setLit(false);
      return;
    }
    const t = window.setTimeout(() => setLit(true), LIGHT_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [finaleMode]);

  // Once they're lit, open the birthday note (only when the birthday itself is on screen).
  useEffect(() => {
    if (!lit || !isBirthday) return;
    const t = window.setTimeout(() => setView('note'), NOTE_AFTER_LIT_MS);
    return () => window.clearTimeout(t);
  }, [lit, isBirthday]);

  // Dates after "today" stay locked. (In preview, today is the date in the link, so nothing is locked.)
  const locked = startOfDay(date) > startOfDay(today);
  // The cake is driven by the calendar, not by anything stored: every candle up to today is on it.
  const through = today;

  const numberDate = pad2(date.getDate());
  const month = MONTHS[date.getMonth()];

  let entry: Present;
  if (locked) {
    entry = { title: 'Not yet', note: `This one opens on ${formatLong(date)}.` };
  } else {
    entry = presents[presentKey(date)] || fallbackPresent(today);
  }
  const { title, note, emoji, rise } = entry;

  const isNoteView = view === 'note';
  const toggleNote = () => setView(isNoteView ? 'date' : 'note');

  return (
    <div className={`App ${lit ? 'lit' : ''}`}>
      {<SnowFlakes num={30} snowflake={emoji} rise={rise}></SnowFlakes>}
      <div className="stage">
        <div className={`dateView view ${isNoteView ? 'hide' : 'show'}`} onClick={toggleNote} aria-hidden={isNoteView}>
          <div className='month'>{month}</div>
          <div className="number">{numberDate}</div>
          <div>{title}</div>
        </div>
        <div className={`noteView ${isNoteView ? 'show' : 'hide'}`} aria-hidden={!isNoteView}>
          <div>
            {note}
          </div>
          <div className={`closeButton ${isNoteView ? '' : 'disable'}`} onClick={toggleNote}>Close</div>
        </div>
      </div>
      <Cake
        days={DAYS}
        through={through}
        finale={finaleMode}
        lit={lit}
        currentKey={key}
      />
    </div>
  );
}

export default App;
