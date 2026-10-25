import { useEffect, useMemo, useState } from 'react';
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
  const snowflakeStyles = useMemo(() => {
    return arr.map((_, index) => {
      const seed = index * 13.7 + 3.1 + (snowflake.length || 1) * 0.37;
      const left = 2 + ((Math.sin(seed) * 0.5 + 0.5) * 96);
      const xDelay = ((Math.sin(seed * 1.7) * 0.5 + 0.5) * 8).toFixed(1);
      const yDelay = ((Math.cos(seed * 2.3) * 0.5 + 0.5) * 4).toFixed(1);
      const fallDuration = (8 + ((Math.sin(seed * 3.1) * 0.5 + 0.5) * 8)).toFixed(2);
      const swayDuration = (2 + ((Math.cos(seed * 1.9) * 0.5 + 0.5) * 3)).toFixed(2);

      return {
        left: `${left}%`,
        animationDelay: `${xDelay}s, ${yDelay}s`,
        animationDuration: `${fallDuration}s, ${swayDuration}s`,
      };
    });
  }, [arr, snowflake]);

  return <div className={`snowflakes ${rise ? 'rise' : ''}`}>
    {arr.map((_, index) => (
      <div
        className="snowflake"
        key={`snow-${index}`}
        style={snowflakeStyles[index]}
      >
        {snowflake}
      </div>
    ))}
  </div>;
}

function fallbackPresent(now: Date): Present {
  if (startOfDay(now) < RUNWAY_START) {
    return { title: 'Almost time', note: `Your calendar starts on ${formatLong(RUNWAY_START)}.` };
  }
  return { title: 'No present today', note: 'Try ?preview#11.02.2026 to preview a day' };
}

const DAYS = runwayDays();

export function listenForBlow(onBlow: () => void): () => void {
  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!navigator.mediaDevices?.getUserMedia || !AudioCtor) {
    return () => {};
  }

  let stream: MediaStream | undefined;
  let frameId = 0;
  let active = false;
  let startedAt = 0;
  let cleaned = false;

  const cleanup = () => {
    cleaned = true;
    if (frameId) window.cancelAnimationFrame(frameId);
    stream?.getTracks().forEach((track) => track.stop());
  };

  const start = async () => {
    if (cleaned) return;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      const audioContext = new AudioCtor();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);

      const tick = () => {
        if (cleaned) return;

        analyser.getByteTimeDomainData(data);
        let sum = 0;

        for (let i = 0; i < data.length; i++) {
          const value = data[i];
          const delta = (value - 128) / 128;
          sum += delta * delta;
        }

        const rms = Math.sqrt(sum / data.length);
        const strongBlow = rms > 0.18;

        if (strongBlow && !active) {
          active = true;
          startedAt = performance.now();
        }

        if (active && strongBlow && performance.now() - startedAt > 150) {
          onBlow();
          active = false;
          return;
        }

        if (!strongBlow) {
          active = false;
        }

        frameId = window.requestAnimationFrame(tick);
      };

      frameId = window.requestAnimationFrame(tick);
    } catch {
      // Browsers can block mic access; the click/space fallback still works.
    }
  };

  void start();

  return cleanup;
}

function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [view, setView] = useState<View>('date');
  const [lit, setLit] = useState(false);
  const [micRequested, setMicRequested] = useState(false);

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
  const cakeWindowDate = preview && parsed.kind === 'date' ? parsed.date : today;
  const hasCake = startOfDay(cakeWindowDate) >= RUNWAY_START && startOfDay(cakeWindowDate) <= FINALE_DATE;

  // Dec 2 (or ?finale): light the candles automatically. Back to unlit if we leave that day (preview).
  useEffect(() => {
    if (!finaleMode) {
      setLit(false);
      return;
    }
    const t = window.setTimeout(() => setLit(true), LIGHT_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [finaleMode]);

  useEffect(() => {
    const background = lit ? 'rgb(2, 17, 41)' : 'rgb(223, 206, 190)';
    document.body.style.backgroundColor = background;
    document.documentElement.style.backgroundColor = background;
  }, [lit]);

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

  const runwayNumber = DAYS.find((d) => d.key === key)?.n;

  const isNoteView = view === 'note';
  const toggleNote = () => setView(isNoteView ? 'date' : 'note');
  const blowOutCandles = () => {
    if (!lit) return;
    setLit(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && lit) {
        event.preventDefault();
        blowOutCandles();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lit]);

  useEffect(() => {
    if (!lit || !hasCake || !micRequested) return;
    const cleanup = listenForBlow(blowOutCandles);
    return cleanup;
  }, [lit, hasCake, micRequested]);

  const requestMicBlow = () => {
    if (!lit) return;
    setMicRequested(true);
  };

  return (
    <div className={`App ${lit ? 'lit' : ''}`}>
      {<SnowFlakes num={16} snowflake={emoji} rise={rise}></SnowFlakes>}
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
      {hasCake && (
        <Cake
          days={DAYS}
          through={through}
          finale={finaleMode}
          lit={lit}
          currentKey={key}
          onBlow={blowOutCandles}
          onActivateMic={requestMicBlow}
        />
      )}
    </div>
  );
}

export default App;
