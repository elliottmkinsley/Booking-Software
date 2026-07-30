# Workspace Overview - Radiant Booking Software

Last updated: 2026-07-30

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
labService, bookingService, peopleService, trainingService). These are async
functions that currently read/write an in-memory mock store seeded from
`src/data/mockData.ts`.

When the Azure backend exists, ONLY the service files should change (to fetch()
calls against the API). Pages and components must never touch mock data directly.
Keep this convention when adding features.

## Three roles (user decision, 2026-07-30)
Sign-in has a radio group with THREE roles: Standard User, Lab Owner, Admin
(this replaced the old single "Admin" checkbox). The user plans to grow each
role's capabilities over time, so keep role logic centralized in `src/roles.ts`
(`ROLE_LABELS`, `SIGN_IN_ROLES`, `canManageEquipment`) rather than scattering
`role === "admin"` checks through components.

Current capabilities (deliberately coarse):
- canManageEquipment = admin OR labOwner -> sees "+ Add Equipment/Software"
- Everyone can reserve from an equipment page's Reserve button.

## Current auth behavior (intentionally fake)
- Sign-in accepts ANY username/password (no validation) - real users come later
  with the database.
- The role is CHOSEN on the sign-in form, not looked up.
- Sign-up UI exists but is intentionally non-functional (placeholder).
- Session persists in sessionStorage via AuthContext.
- User emails are faked as `<username>@nau.edu` via `emailForUser()`.

## Data model (mirrors intended future DB tables)
- User: id, username, role ("user" | "labOwner" | "admin")
- Lab: id, name, description
- Person: id, name, title, email  (staff: equipment owners / certified trainers)
- Training: id, name, description
- Equipment: id, labId (null for software), name, description,
  category ("equipment" | "software"), status, imageUrl, trainingIds[],
  ownerId, trainerIds[], userGuideUrl
- Booking: id, equipmentId, userId, userName, startDate, endDate

Training COMPLETION records are not a table yet: `trainingService` derives
completion deterministically from the username hash so demo accounts show
stable, varied records. Replace with a real user_training table.

## Software is NOT associated with a lab (user decision, 2026-07-20)
Software licenses are shared across labs, so software items have labId = null.
The software list is shown DIRECTLY on the main menu in a "Software" section
under the labs grid (no separate page/folder - the user explicitly asked for
this over a "Software Library" card). Labs contain physical equipment only.
The shared list/book/add UI is `src/components/EquipmentBrowser.tsx`, used by
both LabDetailPage and the main menu's software section.

## App structure
- `/` - sign-in page with role radio group (SignInPage)
- `/labs` - main menu: grid of lab cards + inline Software section
  (MainMenuPage)
- `/labs/:labId` - lab detail: equipment list, managers can add (LabDetailPage)
- `/equipment/:equipmentId` - equipment landing page (EquipmentDetailPage)
- `/profile` - my reservations + my trainings (ProfilePage), reached by clicking
  the username in the header
- Route guard redirects unauthenticated users to `/`.

## Equipment landing page (added 2026-07-30)
`/equipment/:equipmentId` shows, in this order: placeholder image, name +
category badge, owning lab link, description, "Training required" (each training
badged Completed/Required for the signed-in user), "Owner and certified
trainers" (PersonCard with a mailto Email button each), "User guide" link,
a large Reserve button, then the reservation calendar.

Reserving now happens from this page. Equipment rows in lists link here with a
"View details" button instead of an inline Book button.

`BookingCalendar` is a month grid with prev/next navigation; days with
reservations are highlighted with a count badge and clicking a day lists who
reserved it. It reads real mock bookings, so newly created reservations appear.

## Gotchas
- Use `src/utils/dates.ts` (`todayIso`, `isoDate`, `isoDateOffset`) for dates.
  Do NOT use `new Date().toISOString()` for calendar dates - it is UTC and can
  land on the wrong local day.
- Placeholder equipment image lives at `public/equipment-placeholder.svg` and
  MUST be referenced via `import.meta.env.BASE_URL` because the GitHub Pages
  build serves from `/Booking-Software/`. `src/vite-env.d.ts` provides the types
  for `import.meta.env`.
- `mockStore.ts` STORAGE_KEY is versioned (`radiant-mock-store-v3`). Bump the
  suffix whenever the seed data shape changes, otherwise returning users get a
  stale sessionStorage copy missing new fields.

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
Labs, equipment, staff (people), trainings, and bookings in
`src/data/mockData.ts` are plausible placeholders invented for the
remote-sensing domain, not real Radiant Center data. Replace when available.
Specifically fake: all `@nau.edu` staff emails, the `example.com` user guide
URLs, and the seeded reservations (dated relative to today so the calendar
always has content).
