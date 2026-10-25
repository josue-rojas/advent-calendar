# Advent Calendar for Irene's Birthday Month

## 2026: 30 candles

Each candle has an NFC tag that links to its day, e.g. `https://withcheesepls.com/advent-calendar/#11.02.2026`. The page shows that day's gift with a birthday cake underneath; scanning a tag puts its candle on the cake. On Dec 2 all 30 candles are on the cake, a "Light the candles" button lights them, and the room goes dark. Tap any candle on the cake to open its day.

- Day N = Nov 1+N (Day 1 = Nov 2, Day 30 = Dec 1). Dec 2 is the finale.
- Content lives in `src/presents2026.ts`. `npm run check:notes` lists entries that still have `TODO`.
- `npm run tags` writes `tags.csv` with the 30 tag URLs (set `BASE_URL` to change the host).
- Scanning is idempotent: scanned days are stored as a set of dates in `localStorage`, so repeat scans never add a second candle.
- Future days are locked ("Not yet"). Add `?preview` to the URL to bypass the lock for testing (nothing is saved), e.g. `/advent-calendar/?preview#11.20.2026`.
- `?finale` previews the Dec 2 "Light the candles" moment early.
- Deploy: `npm run deploy`.
