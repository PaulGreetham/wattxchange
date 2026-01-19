# WattXchange

WattXchange is an internal Next.js dashboard for monitoring solar and wind energy production across multiple parks. It processes CSV files, aggregates data hourly, and presents interactive charts and tables with filtering by quarter/year or custom date/time range.

## Features
- Interactive area charts (solar, wind, combined) using shadcn/ui charts (Recharts).
- Date/time filtering with a toggle between preset ranges (quarter/year) and custom date/time range.
- Per-park and all-parks views (solar and wind).
- Searchable, paginated data tables (TanStack Table) with totals.
- Dark mode toggle.
- GitHub Actions test workflow (Jest).

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts
- TanStack Table
- PapaParse (CSV parsing)

## Project Structure
```
app/
  layout.tsx
  page.tsx
components/
  app-sidebar.tsx
  charts/energy-area-chart.tsx
  filters/date-time-range-picker.tsx
  tables/energy-data-table.tsx
  ui/...
lib/
  charts/
    types.ts
    utils.ts
  design.ts
```

## Filtering Behavior
Each chart has a toggle:
- **Preset**: quarters + full years (from available data).
- **Date/time range**: choose single day or range with times.

The filter applies to both the chart and its table.

## Getting Started
Install dependencies and run the dev server:
```bash
npm install
npm run dev
```

Open http://localhost:3000

## Scripts
```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # start production server
npm run lint     # lint
npm run test     # jest unit tests
```

## Tests
Jest + Testing Library are configured. Run:
```bash
npm run test
```

Tests live in `__tests__/` and currently cover chart utilities.

## Deployment
The app is compatible with AWS Amplify or Vercel.

### AWS Amplify
- Connect the GitHub repo.
- Amplify will run `npm ci` and `npm run build`.

### GitHub Actions
A workflow is included at `.github/workflows/tests.yml` to run `npm test` on pushes/PRs.

## License
Internal use only.
