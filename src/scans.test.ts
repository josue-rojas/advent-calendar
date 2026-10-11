import { insertScan, loadScans, recordScan, StorageLike } from './scans';

function fakeStorage(): StorageLike & { writes: number } {
  const data: { [k: string]: string } = {};
  return {
    writes: 0,
    getItem(k) { return k in data ? data[k] : null; },
    setItem(k, v) { data[k] = v; this.writes++; },
  };
}

test('insertScan is insert-only', () => {
  const first = insertScan([], '2026-11-02');
  expect(first).toEqual({ list: ['2026-11-02'], added: true });
  const again = insertScan(first.list, '2026-11-02');
  expect(again.added).toBe(false);
  expect(again.list).toBe(first.list);
});

test('scanning the same day many times leaves one candle and one write', () => {
  const s = fakeStorage();
  const results = [1, 2, 3, 4, 5].map(() => recordScan('2026-11-09', s));
  expect(results.map((r) => r.added)).toEqual([true, false, false, false, false]);
  expect(loadScans(s)).toEqual(['2026-11-09']);
  expect(s.writes).toBe(1);
});

test('out-of-order scans stay keyed by date', () => {
  const s = fakeStorage();
  recordScan('2026-11-10', s);
  recordScan('2026-11-04', s);
  expect(loadScans(s)).toEqual(['2026-11-04', '2026-11-10']);
});

test('ignores corrupt storage and works with no storage', () => {
  const s = fakeStorage();
  s.setItem('advent-calendar:2026:scans', '{not json');
  expect(loadScans(s)).toEqual([]);
  expect(recordScan('2026-11-02', null)).toEqual({ list: ['2026-11-02'], added: true });
});
