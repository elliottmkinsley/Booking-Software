# Workspace Overview - Radiant Booking Software

Last updated: 2026-07-20

## Purpose of this folder
This `memory/` folder is shared knowledge for AI agents working in this workspace.
Read this before making changes. When you learn something important about the
project, the user's workflow, or decisions that were made, document it here
(update this file or add new topic-specific markdown files).

## Project purpose
A web application for booking equipment and software across multiple labs at the
Radiant Center for Remote Sensing, a lab conglomerate at NAU (Northern Arizona
University). Users browse labs, find equipment/software, and book it. Admins can
additionally view and add equipment.

## Development approach (per the user)
- Iterative development: UI/design phase first, backend wired up later.
- Target: web application (chosen over desktop for accessibility).
- Future backend: cloud-hosted database on Azure (likely Azure SQL) behind an API.
- Must always be testable locally (`npm run dev`).

## Tech stack decisions
- React 18 + Vite + TypeScript, React Router (chosen by user on 2026-07-20).
- Plain CSS design system in `src/index.css` (no UI framework).
- No backend yet. All data is mocked.

## Critical architecture convention: the service layer
All data access from pages/components goes through `src/services/` (authService,
labService, bookingService). These are async functions that currently read/write
an in-memory mock store seeded from `src/data/mockData.ts`.

When the Azure backend exists, ONLY the service files should change (to fetch()
calls against the API). Pages and components must never touch mock data directly.
Keep this convention when adding features.

## Current auth behavior (intentionally fake)
- Sign-in accepts ANY username/password (no validation) - real users come later
  with the database.
- An "Admin" checkbox on the sign-in form decides if the session is admin.
- Sign-up UI exists but is intentionally non-functional (placeholder).
- Session persists in sessionStorage via AuthContext.

## Data model (mirrors intended future DB tables)
- User: id, username, isAdmin
- Lab: id, name, description
- Equipment: id, labId (null for software), name, description,
  category ("equipment" | "software"), status
- Booking: id, equipmentId, userId, startDate, endDate

## Software is NOT associated with a lab (user decision, 2026-07-20)
Software licenses are shared across labs, so software items have labId = null.
The software list is shown DIRECTLY on the main menu in a "Software" section
under the labs grid (no separate page/folder - the user explicitly asked for
this over a "Software Library" card). Labs contain physical equipment only.
The shared list/book/add UI is `src/components/EquipmentBrowser.tsx`, used by
both LabDetailPage and the main menu's software section.

## App structure
- `/` - sign-in page (SignInPage)
- `/labs` - main menu: grid of lab cards + inline Software section with
  book/add behavior (MainMenuPage)
- `/labs/:labId` - lab detail: equipment list; users book items, admins can add
  equipment (LabDetailPage)
- Route guard redirects unauthenticated users to `/`.

## Deployment (added 2026-07-23)
- GitHub repo: https://github.com/elliottmkinsley/Booking-Software
- Live site: https://elliottmkinsley.github.io/Booking-Software/
- Workflow: `.github/workflows/deploy.yml` builds with Vite and pushes `dist/`
  to the `gh-pages` branch (peaceiris/actions-gh-pages).
- **One-time manual step:** repo owner must enable Pages at Settings → Pages,
  source = Deploy from branch → `gh-pages` → `/ (root)`. Until that is done,
  the workflow succeeds but the public URL returns 404.
- HashRouter (URLs like /#/labs) + vite base `/Booking-Software/` for prod
  builds only. Keep both when touching routing or build config.
- Data is still per-browser sessionStorage; devices do not share bookings.

## Seed data note
Labs and equipment in `src/data/mockData.ts` are plausible placeholders invented
for the remote-sensing domain, not real Radiant Center inventory. Replace with
real data when available.
