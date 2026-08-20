# Roles and permissions

Who can do what, in the demo today and in the planned Azure version.

The sign-in form picks a **session role**. Lab managers also need to be in the
directory and assigned to labs — the radio button alone is not enough.

## Roles today (mock)

| Sign-in radio | Enum | Meaning |
| --- | --- | --- |
| Standard User | `user` | Browse, enroll, request trainings, book, report low stock |
| Lab Owner | `labOwner` | Session label for lab managers — **not enough alone** |
| Admin | `admin` | Center-wide management |

UI copy says **Lab Manager**; the session enum is still `labOwner`. In Azure,
prefer persisting `lab_manager` and update the enum when you wire auth.

### Extra capability layers (not chosen on the form)

| Layer | How it is granted | Effect |
| --- | --- | --- |
| Lab manager assignment | Account in `labManagerAccountIds` + labs in `labManagerLabIds` | Can manage inventory for assigned labs **only if** session role is `labOwner` |
| Trainer | Account in `trainerAccountIds` | Can review training requests / see related notifications without labOwner session |
| Dev bypass | Username `dev` (`isDevUser`) | Sees all labs; many admin-like writes. **Do not ship to production.** |

## Capability matrix (current app)

| Capability | Standard user | Lab manager\* | Trainer | Admin |
| --- | --- | --- | --- | --- |
| Browse labs / equipment / software | ✓ | ✓ (assigned labs) | ✓ | ✓ |
| Book equipment (if trainings complete) | ✓ | ✓ | ✓ | ✓ |
| Request training access | ✓ | | | |
| Enroll trainings from equipment | ✓ | ✓ | ✓ | ✓ |
| Report consumable low | ✓ | ✓ | ✓ | ✓ |
| Add/edit equipment in a lab | | ✓ assigned | | ✓ |
| Import Excel equipment | | ✓ assigned | | ✓ |
| Set equipment trainings / trainers | | ✓ assigned | | ✓ |
| Manage consumables / restock | | ✓ assigned | | ✓ |
| Manage trainer directory | | ✓ | | ✓ |
| Review training requests (relevant) | | ✓ | ✓ | ✓ |
| Manage training catalog (add/remove) | | | | ✓ |
| Add software / create labs | | | | ✓ |
| Assign lab managers | | | | ✓ |
| View activity log | | | | ✓ |

\*Lab manager = session `labOwner` + directory Account + manager assignment + lab assignment.

## Target Azure model

1. Authenticate once (Entra ID / local auth) → single **Users** row.
2. Load **UserRoles** + **LabManagerLabs** from the database — never trust a
   client-selected role.
3. Map capabilities in the API (mirror `src/business/permissions.ts`), not in the
   React client alone.
4. Drop `isDevUser` or gate it behind a non-production environment flag.

## Code locations

- Coarse UI helpers: `src/shared/roles.ts`
- Real gates: `src/business/permissions.ts`
- Per-request review: `canReviewRequest` in `src/business/trainings.ts`
- Notification visibility: `canSeeNotification` in `src/business/notifications.ts`
