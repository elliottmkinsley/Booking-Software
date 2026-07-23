# Radiant Booking

Web application for booking equipment and software across the labs of the
Radiant Center for Remote Sensing at NAU.

## Status

UI/design phase. All data is mocked in the frontend; no backend or database
exists yet. Sign-in accepts any username/password (check "Sign in as Admin"
to get admin capabilities). A future Azure-hosted database and API will replace
the mock service layer in `src/services/`.

## Live demo

Deployed automatically to GitHub Pages on every push to `main`:
https://elliottmkinsley.github.io/Booking-Software/

Note: with no backend yet, all data is per-browser (sessionStorage), so
bookings made on one device are not visible on another.

## Running locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

## Tech stack

- React 18 + Vite + TypeScript
- React Router for navigation
- Plain CSS design system (`src/index.css`)

## Project structure

- `src/pages/` - SignInPage, MainMenuPage (labs grid), LabDetailPage (equipment)
- `src/components/` - shared UI (header, booking modal)
- `src/services/` - data access layer (currently mock, later Azure API calls)
- `src/data/mockData.ts` - placeholder seed labs and equipment
- `src/context/AuthContext.tsx` - session state
- `memory/` - accumulated project knowledge for AI-assisted development
