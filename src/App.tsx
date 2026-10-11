import { useEffect, useState } from 'react';
import './App.css';
import { presents } from './presents';
import { Present } from './types';
import Cake from './Cake';
import {
  FINALE_DATE,
  RUNWAY_START,
  RunwayDay,
  dateKey,
  formatLong,
  hashFor,
  parseHash,
  presentKey,
  runwayDays,
  startOfDay,
  MONTHS,
  pad2,
} from './dates';

export type { Present } from './types';

type View = 'date' | 'note';

// max 10
function SnowFlakes({ num, snowflake = '❅', rise = false }: { num: number; snowflake?: string; rise?: boolean }) {
  const arr = new Array(num).fill(0);

  return <div className={`snowflakes ${rise ? 'rise' : ''}`}>
    {arr.map((_, index) => {
      return (
        <div className="snowflake" key={`snow-${index}`}>
          {snowflake}
        </div>
      )
    })}
  </div>
}

function fallbackPresent(now: Date): Present {
  if (startOfDay(now) < RUNWAY_START) {
    return { title: 'Almost time', note: `Your calendar starts on ${formatLong(RUNWAY_START)}.` };
  }
  return { title: 'No present today', note: 'Tap one of your candles to open its day.' };
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

  // After the candles light up, show the day's note.
  useEffect(() => {
    if (!lit) return;
    const t = window.setTimeout(() => setView('note'), 1800);
    return () => window.clearTimeout(t);
  }, [lit]);

  const now = new Date();
  const params = new URLSearchParams(window.location.search);
  const preview = params.has('preview');
  const finaleMode = startOfDay(now) >= FINALE_DATE || params.has('finale');

  const parsed = parseHash(hash);
  const date = parsed.kind === 'date' ? parsed.date : startOfDay(now);
  const key = dateKey(date);

  // Dates in the future stay locked unless ?preview is set.
  const locked = !preview && startOfDay(date) > startOfDay(now);
  // The cake is driven by the calendar, not by anything stored: every candle up to today is on it.
  // With ?preview, it shows candles up to the date in the link so you can check future days.
  const through = preview && parsed.kind === 'date' ? date : now;

  const numberDate = pad2(date.getDate());
  const month = MONTHS[date.getMonth()];

  let entry: Present;
  if (locked) {
    entry = { title: 'Not yet', note: `This one opens on ${formatLong(date)}.` };
  } else {
    entry = presents[presentKey(date)] || fallbackPresent(now);
  }
  const { title, note, emoji, rise } = entry;

  const runwayNumber = DAYS.find((d) => d.key === key)?.n;

  const openDay = (day: RunwayDay) => {
    window.location.hash = hashFor(day.date);
  };

  const isNoteView = view === 'note';
  const toggleNote = () => setView(isNoteView ? 'date' : 'note');

  return (
    <div className={`App ${lit ? 'lit' : ''}`}>
      {<SnowFlakes num={10} snowflake={emoji} rise={rise}></SnowFlakes>}
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
          {runwayNumber && !locked && (
            <div className="candleHint">Candle {runwayNumber} of 30</div>
          )}
          <div className={`closeButton ${isNoteView ? '' : 'disable'}`} onClick={toggleNote}>Close</div>
        </div>
      </div>
      <Cake
        days={DAYS}
        through={through}
        finale={finaleMode}
        lit={lit}
        currentKey={key}
        onSelect={openDay}
      />
      {true && !lit && (
        <button type="button" className="lightButton" onClick={() => setLit(true)}>
          Light the candles
        </button>
      )}
    </div>
  );
}

export default App;
