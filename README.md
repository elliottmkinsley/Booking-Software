# Radiant Booking

Web application for booking equipment and software across the labs of the
Radiant Center for Remote Sensing at NAU.

## Status

UI/design phase. All data is mocked in the frontend; no backend or database
exists yet. Sign-in accepts any username/password (check "Sign in as Admin"
to get admin capabilities). A future Azure-hosted database and API will replace
the mock service layer in `src/services/`.

## Live demo

**Site URL:** https://elliottmkinsley.github.io/Booking-Software/

Every push to `main` rebuilds and publishes to the `gh-pages` branch via GitHub Actions.

### One-time enable (repo owner, ~30 seconds)

GitHub Pages must be turned on once in the repo:

1. Open [Booking-Software → Settings → Pages](https://github.com/elliottmkinsley/Booking-Software/settings/pages)
2. Under **Build and deployment → Source**, choose **Deploy from a branch**
3. Set **Branch** to `gh-pages` and folder to **`/ (root)`**, then click **Save**
4. Wait 1–2 minutes for the site to go live at the URL above

After that, future pushes to `main` update the live site automatically.

Note: with no backend yet, all data is per-browser (sessionStorage), so bookings made on one device are not visible on another.

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
