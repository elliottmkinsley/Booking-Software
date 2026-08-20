# Radiant Booking

A website for booking lab equipment and looking up shared software at the
**Radiant Center for Remote Sensing** (Northern Arizona University).

If you work in a lab here, the idea is simple: sign in, pick a lab, find the
instrument you need, and reserve it on a calendar. If a piece of gear requires
training first, the site walks you through that too.

---

## What you can do today

This is still a **design and workflow demo**. It looks and behaves like the
real product, but everything you see is sample data stored in *your browser
only*. There is no shared database yet, so a booking you make on one computer
will not show up on someone else’s.

You can:

- Browse labs (drones, LiDAR, spectroscopy, GIS, field instruments)
- Open a piece of equipment and reserve days or time slots
- Look up shared software (no reservation needed — just download / contact info)
- Enroll in trainings and request that someone mark you as complete
- Report when a consumable (batteries, targets, etc.) is running low

**Admins and lab managers** can also add labs and equipment, import a
spreadsheet of gear, assign managers, and review training requests.

---

## Try the live demo

**https://elliottmkinsley.github.io/Booking-Software/**

Sign-in accepts **any username and password**. Use the “Sign in as” radios to
choose what you can do:

| Sign in as | What you will see |
| --- | --- |
| **Standard User** | Browse, book, enroll in trainings, report low stock |
| **Lab Owner** | Same as a user, plus manage inventory for labs assigned to your account |
| **Admin** | Everything — create labs, assign managers, edit the training catalog, view the activity log |

A couple of useful demo accounts are already in the sample data:

- Username **`dev`** (any role) — a developer shortcut that shows every lab
- Username **`nakai`** as Lab Owner — Marisa Nakai, who already manages the UAS lab

Sign Up is a placeholder. Real accounts will exist once the database is connected.

### First-time GitHub Pages setup (repo owner)

The live site is rebuilt on every push to `main`. GitHub Pages only needs to be
turned on once:

1. Open [Settings → Pages](https://github.com/elliottmkinsley/Booking-Software/settings/pages)
2. Under **Build and deployment → Source**, choose **Deploy from a branch**
3. Set **Branch** to `gh-pages` and folder to **`/ (root)`**, then **Save**
4. Wait a minute or two for the URL above to go live

---

## Run it on your computer

You need [Node.js](https://nodejs.org/) 20 or newer (GitHub’s build uses 22).

```bash
git clone https://github.com/elliottmkinsley/Booking-Software.git
cd Booking-Software
npm install
npm run dev
```

Vite will print a local address — usually **http://localhost:5173**. Open that
in a browser.

To preview the *production* build the same way GitHub Pages serves it (the app
lives under `/Booking-Software/` on the live site):

```bash
npm run build
npx vite preview --base=/Booking-Software/
```

---

## How the project is organized

The code is split into **three layers** so a future Azure API + SQL database
can replace only the data layer. Details and import rules:
[`src/README.md`](./src/README.md).

| Folder | What it is |
| --- | --- |
| `src/presentation/` | Screens and UI (pages, components, header, CSS) |
| `src/business/` | Rules: who can do what, reservations, trainings, audit log |
| `src/data/` | Fake database today (`repositories/` + `mockStore`). **This is the swap point for Azure.** |
| `src/shared/` | Types, role labels, date/time/image helpers |
| `Diagrams and Tables/` | Plans for the future Azure SQL database |

---

## How data works right now (and what comes next)

Today, the app keeps everything in **session storage** — a small notebook the
browser wipes when you close the tab. That is why the demo feels real but is
not shared. GitHub Pages still serves only the presentation build.

When Radiant hosts this on Azure:

1. Keep the function names in `src/business/` (so the screens barely change)
2. Replace `src/data/repositories/` with `fetch()` calls to a real API
3. Put the tables described in **`Diagrams and Tables/`** into Azure SQL

Open that folder for:

- An interactive diagram ([dbdiagram.io](https://dbdiagram.io) + `radiant-schema.dbml`)
- An Excel workbook of every planned table (`radiant-tables.xlsx`)
- Notes on merging “users / accounts / people” into one identity table

---

## Tech stack (for developers)

- React 18, Vite, and TypeScript
- React Router (hash URLs, so GitHub Pages can refresh any page)
- Plain CSS in `src/presentation/styles/index.css` — no UI kit
- ExcelJS, loaded only when someone opens the equipment importer

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local development site |
| `npm run build` | Type-check and build files for GitHub Pages |
| `npm run preview` | Serve the production build locally |
| `node scripts/build-schema-workbook.mjs` | Rebuild `Diagrams and Tables/radiant-tables.xlsx` |
