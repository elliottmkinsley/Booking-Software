# Azure migration notes

Things to decide (or clean up) **before or while** connecting a real Azure SQL
database. The demo app works without this — these notes are for the person
who wires up the backend.

---

## 1. Unify identity (highest priority)

The mock app has **three** kinds of "person," each with its own ids:

| Concept | Id example | Used for |
| --- | --- | --- |
| Session `User` | `user-dev` | Bookings, enrollments, requests, activity actor, notification reads |
| `Account` | `acct-nakai` | Directory, lab managers, trainers, `equipment.trainerIds` |
| `Person` | `person-reyes` | Staff list, **`equipment.ownerId` only** |

Same people often exist as both Account and Person with different ids. The UI
already converts trainers with `accountAsPerson()` in `src/shared/utils/identity.ts`.

**Azure target:** one **Users** table. Point `owner_user_id` and trainer FKs at
the same id space. Migrate seed data so Reyes/Nakai/etc. are single rows with
optional `title` and roles.

Until then, the mock can keep working; do not invent a fourth id scheme.

---

## 2. Replace fictional training completion

`src/business/trainings.ts` derives “completed” from a username hash for demo variety,
unless `approvedTrainingIds` overrides it.

**Azure:** only `UserTrainingCompletions` (and optionally status on enrollment)
should decide completion. Delete the hash path when the API exists.

---

## 3. Cascades and orphans

Implement these server-side (today they are hand-coded in `src/data/repositories/`):

| Delete | Also clear |
| --- | --- |
| Lab | Equipment in lab, LabManagerLabs for that lab; decide bookings (orphan vs cascade) |
| Equipment | Bookings?, consumables for that item, EquipmentTrainings, EquipmentTrainers |
| Training | EquipmentTrainings, enrollments, completions, access requests, related notifications |
| Trainer role | EquipmentTrainers rows for that user |
| Lab manager role | LabManagerLabs rows |

Documented mock gap: `removeLab` leaves bookings for deleted equipment orphaned.

---

## 4. Denormalized display fields

Mock stores names next to ids for easy rendering:

- `Booking.userName`
- `TrainingAccessRequest.userName` / `reviewedByUserName`
- `Consumable.reportedLowByUserName`
- `ActivityEvent.actorName` / `actorRole`

**Azure:** join Users for live display. Keep snapshots only on **ActivityLog**
(and maybe request review audit) so history still makes sense after renames.

---

## 5. Notifications audience

Mock: `notifyAdmin`, `notifyLabIds[]`, `notifyTrainerAccountIds[]`, `readByUserIds[]`.

**Prefer:** store the event facts (type + FKs) and compute who can see a
notification from roles/assignments at query time. Use **NotificationReads**
for read state. Add recipient snapshot rows only if you need “who was notified
then” for compliance.

---

## 6. Equipment vs software

One table with `category` is fine (current UI). Enforce:

- software ⇒ `lab_id` null, no trainings/bookings required
- equipment ⇒ `lab_id` required

Images: today data URLs or `public/` paths. On Azure, use Blob Storage and store
the URL only.

---

## 7. Auth

- Stop trusting client-selected role.
- Map Entra groups or DB roles → `UserRoles`.
- Remove production use of username `dev` bypass.

---

## 8. What was cleaned up in the frontend for readability

Before Azure work:

- Layer map and import rules documented in `src/README.md`.
- Types annotated with intended table names.
- Duplicate `accountAsPerson` helpers merged into `src/shared/utils/identity.ts`.
- Unused deprecated `canManageEquipment` removed from `src/shared/roles.ts`.

Larger refactors (splitting `src/business/trainings.ts`, merging Person into Account in
the mock store) are optional and can wait until the Users table exists — they
are called out here rather than forced into a big rewrite.
