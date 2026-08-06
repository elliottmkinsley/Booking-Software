# Workspace Overview - Radiant Booking Software

Last updated: 2026-08-06

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
role's capabilities over time, so keep role logic centralized in
`src/roles.ts` and `src/services/permissionsService.ts` rather than scattering
`role === "admin"` checks through components.

Current capabilities (2026-08-03):
- **Standard user**: browse labs/equipment/software, view equipment pages,
  browse Trainings catalog, request training access, reserve.
- **Lab owner** (session role): must sign in with a username matching an Account
  in the directory AND be listed in `labManagerAccountIds`. Can add equipment
  ONLY to labs assigned in `labManagerLabIds[accountId]`. Sees only assigned
  labs on the main menu. Can manage the Trainers directory and assign trainers
  on equipment in their labs. Cannot add labs, software, or manage other managers.
- **Admin**: manage labs (Edit Labs mode on cards + add), assign labs to
  managers (`LabManagersModal`), create trainings (`TrainingsModal`), add
  equipment to any lab, add software, manage lab manager and trainer accounts,
  view Activity log. Lab managers can use Edit Labs on their assigned labs and
  require catalog trainings on equipment so users must complete them to book.

`permissionsService.ts`: `canAddEquipmentToLab`, `canManageLabs`, `canAddSoftware`,
`canAssignLabsToManagers`, `canManageTrainers`, `canViewActivityLog`, `isDevUser`,
`getVisibleLabsForUser`, etc.

Header nav (`HeaderNav.tsx`) sits in the CENTER of the app header between the
logo and the user area. "Trainings" is a page for all signed-in users. "Trainers"
(admins + assigned lab managers) and admin-only "Lab Managers" / "Activity"
open modals.

## Activity log (admin audit trail, 2026-08-03)
Every mutating service call writes an `ActivityEvent` via `logActivity()` in
`activityService.ts`. Components never log directly.

Tracked actions include signIn, bookings, labs/equipment/software, lab managers,
trainers (`addTrainer` / `removeTrainer` / `setEquipmentTrainers`), trainings,
consumables. Events live in `store.activities` (STORAGE_KEY v13).

## Trainings catalog (2026-08-03)
All signed-in users open **Trainings** in the header → `/trainings` catalog
with search + filters. **Your trainings** only lists trainings the user added
from an equipment page via **Add training** (`userTrainingIds` in the store,
`addTrainingsFromEquipment`). Your trainings is split into Incomplete and
Completed sections. Each training has `/trainings/:id` with how-to steps and
trainers/contact information. Standard users see **Request training** on each
incomplete catalog card; it opens that detail page, where they can submit the
request after reviewing how to complete it. Admins and lab managers can view
training details but do not see request actions.

Admins maintain the catalog via **Manage catalog** (`TrainingsModal`).
Managers/admins set equipment requirements (`setEquipmentTrainings`). Reserve
is blocked until required trainings are complete (completion still mock-derived
from username).

## Consumables + low-stock notifications (2026-08-03)
Labs have **Lab consumables** (general supplies). Equipment pages have
**Equipment consumables**. Admins/lab managers can add items and toggle
**Enable notify**. Any signed-in user (or manager) can **Report getting low**;
when notify is on, admins and managers assigned to that lab get an in-app
**Notifications** inbox entry (`notificationService` + `consumableService`).
Managers/admins can **Mark restocked**.

Submitting a training request also creates a **trainingRequest** notification
(`createTrainingRequestNotification`) visible to admins, the `dev` account,
managers of labs whose equipment requires that training, and certified trainers
listed on that equipment (`notifyTrainerAccountIds`). `AppNotification.type` is
`consumableLow | trainingRequest`; `consumableId`, `trainingId` and `requestId`
are nullable depending on the type.

## Training request approval (2026-08-05)
Reviewers = admins / `dev`, lab managers assigned to a lab whose equipment
requires the training, and trainers listed on that equipment. Coarse gate is
`canReviewTrainingRequests(user)` in `permissionsService`; the per-request check
is `canReviewRequest(user, request)` in `trainingService` (needs training→
equipment→lab/trainer lookups, so it cannot live in permissionsService).

- Notifications inbox: `trainingRequest` rows get **Approve request** / **Deny**
  buttons for reviewers, then show an Approved/Denied badge with the reviewer.
- Trainings page has a third tab, **Requests** (`TrainingRequestsPanel`), with a
  Pending / All requests filter. Each row shows the requester, message, labs,
  and mailto chips for the associated trainers and lab managers.
- `approveTrainingRequest` / `denyTrainingRequest` stamp `reviewedAt`,
  `reviewedByUserId`, `reviewedByUserName` on the request and log
  `approveTrainingAccess` / `denyTrainingAccess`.
- Approving writes `store.approvedTrainingIds[userId]` and also enrolls the
  training in the requester's "Your trainings". `buildRecord` checks
  `approvedTrainingIds` FIRST, so an approval overrides the username-hash demo
  completion — that is how approval actually unlocks equipment booking.
- Trainers can now open the notification bell (`canViewNotifications`).

Equipment/software has **rentalGranularity** (`30min` | `hourly` | `daily` |
`weekly`) chosen when adding (or editing) an item; the booking modal adapts
to that increment. Store key: v18.

## Multi-select reservations (2026-08-05)
Clicking a day/slot selects it and clicking it AGAIN unselects it — this is an
explicit user requirement, in BOTH the equipment page calendar and the modal.

The equipment page **Reservation calendar** (`BookingCalendar`) is multi-select:
selection state lives in `EquipmentDetailPage` (`selectedDates`), the panel
below lists reservations for every picked day, and **Reserve selected days**
opens `BookingModal` with those days already chosen (`initialDates` prop, past
days dropped). The user first asked for this on the page calendar, so do not
regress it back to single-select.

`BookingModal` is likewise a toggle picker, not date inputs. What you pick
depends on granularity:
- **daily**: month grid, toggle any number of days.
- **30min / hourly**: month grid picks the ACTIVE day (single-select) and a slot
  grid below toggles times on it. Picks are kept per day in `slotsByDate`, so
  you can hop between days and keep earlier picks. The list holds all 24 hours
  but auto-scrolls to `FIRST_VISIBLE_SLOT` (08:00) on open / day change.
- **weekly**: list of the next 12 week blocks, toggle any number.

On submit, adjacent selections are merged into the fewest reservations
(`mergeContiguousDates` in `dates.ts`, `mergeContiguousSlots` in
`timeSlots.ts`), then written with `createBookings()` — one Booking row per
block but a SINGLE `createBooking` activity event so the audit trail is not
flooded.

`Booking` gained `startTime` / `endTime` (`"HH:MM"`, null = whole day). Render
booking times with `formatBookingWhen()` from `utils/timeSlots.ts`, never by
hand. Days/slots already reserved are disabled and struck through
(`isSlotBooked`); a whole-day booking blocks every slot on that day. Seed
`eq-11` (GPU Workstation) is hourly so the slot picker is reachable without
editing an item first.

## Excel equipment import (2026-08-06)
Lab detail pages show **Import Excel** next to Edit Equipment for anyone who
passes `canAddEquipmentToLab`. `ImportEquipmentModal` is a three-step flow:
download a blank template, upload the filled file, review the parsed rows.

`equipmentImportService.ts` owns both the writing and reading of workbooks.
- ExcelJS is the only runtime dependency added for this; it is ~900 KB, so it
  is behind a dynamic `import("exceljs")` and Vite emits it as its own chunk
  that only loads when the importer is opened. Keep it lazy.
- Template: blank **Equipment** sheet (frozen styled header, dropdowns on
  Rental granularity / Status for 200 rows), an **Instructions** sheet, and a
  **Valid values** sheet listing real owners, trainers, and trainings.
- Parsing matches columns by normalized header substring, so column order and
  minor header edits still work; only Name is mandatory. Owners/trainers/
  trainings are matched by name, username, or email, and unmatched entries
  become per-row problems instead of silently dropping data.
- Rows with problems are shown in red in the preview and skipped on import;
  only clean rows are created. Duplicate names (in the file or already in the
  lab) count as problems.
- `addEquipmentBatch` in `labService` does the writes and logs ONE
  `importEquipment` activity event for the whole batch.

Imported items always get `imageUrl: null` (placeholder). The user accepted
this: pictures cannot come from a spreadsheet and are added later via Edit.

**Software is not bookable** (2026-08-03): no trainings, no reserve/calendar.
Software detail pages show access instructions, download/portal link, and
contact name/email (`downloadUrl`, `accessInstructions`, `contactName`,
`contactEmail` on Equipment).

Seed labs/equipment/software use distinct SVG placeholders under
`public/images/{labs,equipment,software}/` (relative `imageUrl` paths resolved
via `resolveImageUrl` in `images.ts` for GitHub Pages BASE_URL).

**Image upload** on add/edit for labs, equipment, software, and consumables:
`ImageUploadField` supports choose-file + drag-and-drop; stores data URLs in
the mock store. Hint copy (`IMAGE_UPLOAD_HINT`): prefer 16:10 (e.g. 1280×800),
JPG/PNG/WebP under 2 MB, subject centered for cover crop.

Admin UI (`ActivityLogModal`): filter by username search, role (user / lab
manager / admin), action type; sort by last used, oldest, user A–Z, or role;
optional "most recent per user" toggle.

Demo lab managers (sign in as Lab Owner with matching username):
- `areyes` → UAS Lab
- `mobrien` → LiDAR Lab
- `shuang` → Spectroscopy Lab

Dev bypass (2026-08-03): username `dev` (any role) sees every lab and can add
equipment / set trainings on any lab via `isDevUser()` in permissionsService.
Handy for browsing the full inventory without admin role or lab assignments.

**Edit Labs** (admins + lab managers) and **Edit Software** (admins) toggle
inline controls on cards: red × removes; ⋯ opens an edit-info modal. Cards
jiggle in edit mode. Admins also get **+ Add Lab/Software** while editing.
Removing a lab deletes its equipment and clears manager assignments for it.
Lab detail pages get the same Edit Equipment controls for managers/admins.

## Current auth behavior (intentionally fake)
- Sign-in accepts ANY username/password (no validation) - real users come later
  with the database.
- The role is CHOSEN on the sign-in form, not looked up.
- Sign-up UI exists but is intentionally non-functional (placeholder).
- Session persists in sessionStorage via AuthContext.
- User emails are faked as `<username>@nau.edu` via `emailForUser()`.

## Data model (mirrors intended future DB tables)
- User: id, username, role ("user" | "labOwner" | "admin") — session only for now
- Account: id, username, displayName, email — directory of all system accounts
- Lab manager assignments: `labManagerAccountIds[]` plus
  `labManagerLabIds: Record<accountId, labId[]>` (which labs each manager owns)
- Lab: id, name, description, imageUrl
- Person: id, name, title, email  (staff: equipment owners / certified trainers)
- Training: id, name, description
- Equipment: id, labId (null for software), name, description,
  category ("equipment" | "software"), status, imageUrl, trainingIds[],
  ownerId, trainerIds[], userGuideUrl
- Booking: id, equipmentId, userId, userName, startDate, endDate,
  startTime, endTime (both null for whole-day/multi-day reservations)

Training COMPLETION records are not a table yet: `trainingService` derives
completion deterministically from the username hash so demo accounts show
stable, varied records, EXCEPT where a reviewer approved an access request
(`approvedTrainingIds`), which always counts as complete. Replace both with a
real user_training table.

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
- `/trainings` - training catalog with search/filters (TrainingsPage)
- `/trainings/:trainingId` - how to complete + request access (TrainingDetailPage).
  Links from an equipment page append `?from=<equipmentId>` so the back link
  reads "← Back to <item>" and returns there instead of the trainings list
  (user request 2026-08-05). Links from the catalog/profile omit it.
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

## Lab manager admin (added 2026-07-30, extended 2026-08-03)
Admins manage lab manager role assignments via header -> Lab Managers modal.
- `accountService.ts`: search the account directory, `getAccountByUsername()`
- `labManagerService.ts`: getLabManagers(), addLabManager(), removeLabManager(),
  getLabManagerProfiles(), setAssignedLabs(), getAssignedLabIds()
- Remove clears manager role and assigned labs; logged as `removeLabManager`
- `labService.ts`: addLab() for admin-created labs
- Mock store holds `accounts[]`, `labManagerAccountIds[]`, `labManagerLabIds`
- UI label is "Lab Manager"; maps to labOwner role once real auth exists
- Sign-in still lets anyone pick Lab Owner for demo; real equipment permissions
  require matching username + admin assignment + lab assignment

## Trainers (added 2026-08-03)
Admins and assigned lab managers manage the trainer directory via header ->
Trainers (`TrainersModal` + `trainerService.ts`).
- Store: `trainerAccountIds[]` (Account ids). Equipment.`trainerIds` are also
  Account ids (migrated from Person ids; store key v12).
- Assign trainers to equipment from the equipment detail page (**Edit trainers**),
  gated by `canSetEquipmentTrainings` (same as training requirements).
- Removing a trainer clears them from the global list and all equipment.
- Activity: `addTrainer`, `removeTrainer`, `setEquipmentTrainers`.

## Menus are image card grids (user decision, 2026-07-30)
Labs, equipment, and software are all browsed as a GRID OF BOXES WITH PICTURES,
not lists. The user explicitly asked for this over the earlier list layout.

- Shared markup: `.card-grid` > `.media-card` (an anchor wrapping the whole
  card) > `.media-card-image` + `.media-card-body`. Used by both MainMenuPage
  (labs) and EquipmentBrowser (equipment/software).
- The whole card is the link, so do NOT nest buttons or links inside it.
- Descriptions are clamped to 3 lines so cards in a row stay the same height.
- `.equipment-list` / `.equipment-row` styles still exist but are now used ONLY
  by the profile page's reservation list, which is intentionally still a list.

## Placeholder images
Every lab and equipment item has an `imageUrl` field that is currently null for
all seed data. `src/utils/images.ts` resolves the fallback: labs get
`lab-placeholder.svg`, software gets `software-placeholder.svg`, other
equipment gets `equipment-placeholder.svg` (all in `public/`, hand-written SVG).
Always go through `labImage()` / `equipmentImage()` rather than building the
path inline, so the BASE_URL handling stays in one place.

## Gotchas
- Use `src/utils/dates.ts` (`todayIso`, `isoDate`, `isoDateOffset`) for dates.
  Do NOT use `new Date().toISOString()` for calendar dates - it is UTC and can
  land on the wrong local day.
- Anything in `public/` MUST be referenced via `import.meta.env.BASE_URL`
  because the GitHub Pages build serves from `/Booking-Software/`. See
  `src/utils/images.ts`. `src/vite-env.d.ts` provides the `import.meta.env`
  types.
- `mockStore.ts` STORAGE_KEY is versioned (`radiant-mock-store-v6`). Bump the
  suffix whenever the seed data shape changes. `load()` validates the stored
  shape and re-seeds if fields are missing (stale sessions).

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
- Because the base is build-only, plain `npm run preview` serves at `/` and
  every asset 404s (blank page). To smoke-test a production build locally run
  `npx vite preview --base=/Booking-Software/` and open that URL.
- Data is still per-browser sessionStorage; devices do not share bookings.

## Seed data note
Labs, equipment, staff (people), trainings, and bookings in
`src/data/mockData.ts` are plausible placeholders invented for the
remote-sensing domain, not real Radiant Center data. Replace when available.
Specifically fake: all `@nau.edu` staff emails, the `example.com` user guide
URLs, and the seeded reservations (dated relative to today so the calendar
always has content).
