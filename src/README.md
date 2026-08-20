# Layers (N-tier map)

The app is one Vite/React process, split into three layers plus a shared
folder. Screens never talk to the fake database. When Azure exists, replace
**only** the data repositories with HTTP clients; keep the business function
names so the UI barely changes.

```
src/
  presentation/   UI — pages, components, session, styles
  business/       Rules and use-cases (who can do what, logging, orchestration)
  data/           Persistence — repositories + mockStore + seed + Excel I/O
  shared/         Types, role labels, date/time/image helpers
```

## Import rules

1. **Presentation** may import `business` and `shared` only. Never `data/` or `mockStore`.
2. **Business** may import `data` (repositories) and `shared` only. Never React, never `presentation`.
3. **Data** may import `shared` only (Excel helpers may call other repositories). Never `business`.
4. **Shared** imports nothing from the three tiers.

## Business modules (same names the UI already calls)

| File | Owns |
| --- | --- |
| `auth.ts` | Sign-in |
| `accounts.ts` | People directory search |
| `people.ts` | Staff used as equipment owners |
| `labs.ts` | Labs, equipment, software, required trainings/trainers |
| `bookings.ts` | Reservations |
| `labManagers.ts` | Lab manager role and lab assignments |
| `trainers.ts` | Certified trainer directory |
| `trainings.ts` | Catalog, enrollment, completion, access requests |
| `consumables.ts` | Supplies and low-stock reports |
| `notifications.ts` | Inbox |
| `activity.ts` | Audit log |
| `permissions.ts` | Capability checks |
| `equipmentImport.ts` | Spreadsheet import (calls Excel I/O + `addEquipmentBatch`) |

## Data (the Azure swap point)

| Path | Owns |
| --- | --- |
| `repositories/` | One module per aggregate — later these become `fetch('/api/…')` |
| `mockStore.ts` | In-browser sessionStorage stand-in for a database |
| `seed/mockData.ts` | Sample labs, equipment, people, bookings |
| `excel/equipmentImport.ts` | Build/parse the equipment spreadsheet |

The planned REST routes still live in
[`Diagrams and Tables/service-api-map.md`](../Diagrams%20and%20Tables/service-api-map.md).
Map those routes onto `src/data/repositories/`, not onto the UI.
