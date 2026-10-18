# Fixtures

Filter upcoming FC Barcelona men’s first-team matches and export an `.ics` calendar. Built with Next.js, TypeScript, Tailwind CSS and Bun.

## Setup

```sh
bun install
cp .env.example .env.local
```

Get an API key from [football-data.org](https://www.football-data.org/client/register), set `FOOTBALL_DATA_API_KEY` in `.env.local`, then run:

```sh
bun dev
```

Open http://localhost:3000. Restart the server after changing the key. The key stays on the server; do not use a `NEXT_PUBLIC_` prefix.

Without a key, use **Try demo** to test fictional matches. Demo exports are labeled accordingly.

## Behavior

- `/api/fixtures` fetches `/v4/teams/81/matches` from football-data.org. Coverage depends on the API plan and available fixtures.
- Filter by competition, a preset list of big teams, or specific opponents. Select individual matches before exporting.
- Filters and selection run in the browser. Preferences for real matches are saved in localStorage.
- The big-team preset is defined in `src/lib/fixtures.ts`.
- Times use the browser’s timezone; exported events use UTC.
- Unconfirmed kickoffs are excluded from exports. Events have an estimated duration of two hours.
- Exports do not update automatically. Reimporting may create duplicate events, depending on the calendar app.
- No database, login or sync. Data is fetched on page load or retry.

## Checks

```sh
bun test
bun run lint
bun run typecheck
bun run build
```

Live API verification requires a valid key. Calendar tests cover UTC times, text escaping, UTF-8 line folding, demo labels and exclusion of unconfirmed kickoffs.
