import { dateKey, hashFor, parseHash, presentKey, runwayDays } from './dates';

test('parses MM.DD.YYYY hashes explicitly', () => {
  const p = parseHash('#11.02.2026');
  expect(p.kind).toBe('date');
  if (p.kind === 'date') expect(dateKey(p.date)).toBe('2026-11-02');
});

test('still parses 2022 hashes and slashes', () => {
  const p = parseHash('#12.01.2022');
  expect(p.kind === 'date' && dateKey(p.date)).toBe('2022-12-01');
  expect(parseHash('#1/5/2027').kind).toBe('date');
});

test('rejects garbage and impossible dates', () => {
  expect(parseHash('').kind).toBe('none');
  expect(parseHash('#nope').kind).toBe('none');
  expect(parseHash('#13.40.2026').kind).toBe('none');
  expect(parseHash('#02.30.2026').kind).toBe('none');
});

test('#board is no longer special', () => {
  expect(parseHash('#board').kind).toBe('none');
});

test('runway is 30 days, Nov 2 to Dec 1, and keys match presents', () => {
  const days = runwayDays();
  expect(days).toHaveLength(30);
  expect(days[0].key).toBe('2026-11-02');
  expect(days[29].key).toBe('2026-12-01');
  expect(presentKey(days[0].date)).toBe('NOVEMBER022026');
  expect(presentKey(days[29].date)).toBe('DECEMBER012026');
  expect(hashFor(days[7].date)).toBe('#11.09.2026');
});
