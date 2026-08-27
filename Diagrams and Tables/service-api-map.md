# Service → API map

When Azure exists, **keep the TypeScript function names** in `src/business/`
and replace `src/data/repositories/` with HTTP calls. Screens should barely change.

The routes below are a suggestion — adjust them to match whatever style the
Azure API uses. Every route that *changes* data must require a signed-in user,
and roles should be enforced on the server, not only in the browser.

Auth: all mutating routes require a signed-in user; enforce roles server-side.

---

## Auth

| Business function | Suggested endpoint |
| --- | --- |
| `business/auth.signIn` | `POST /api/auth/sign-in` (or Entra redirect) |
| `business/auth.emailForUser` | Come from Users.email after auth |

## Accounts / users

| Business function | Suggested endpoint |
| --- | --- |
| `business/accounts.getAllAccounts` | `GET /api/users` |
| `business/accounts.searchAccounts` | `GET /api/users?q=` |
| `business/accounts.getAccount` | `GET /api/users/{id}` |
| `business/accounts.getAccountByUsername` | `GET /api/users/by-username/{username}` |
| `business/people.*` | Collapse into Users (see migration notes) |

## Labs & equipment

| Business function | Suggested endpoint |
| --- | --- |
| `business/labs.getLabs` | `GET /api/labs` |
| `business/labs.getLab` | `GET /api/labs/{id}` |
| `business/labs.addLab` / `updateLab` / `removeLab` | `POST/PATCH/DELETE /api/labs[/{id}]` |
| `business/labs.getEquipmentForLab` | `GET /api/labs/{id}/equipment` |
| `business/labs.getSoftware` | `GET /api/software` |
| `business/labs.getEquipment` | `GET /api/equipment/{id}` |
| `business/labs.addEquipment` | `POST /api/labs/{id}/equipment` or `POST /api/software` |
| `business/labs.addEquipmentBatch` | `POST /api/labs/{id}/equipment/import` |
| `business/labs.updateEquipment` / `removeEquipment` | `PATCH/DELETE /api/equipment/{id}` |
| `business/labs.setEquipmentTrainings` | `PUT /api/equipment/{id}/trainings` |
| `business/labs.setEquipmentTrainers` | `PUT /api/equipment/{id}/trainers` |
| `business/equipmentImport.buildEquipmentTemplate` | `GET /api/labs/{id}/equipment/import-template` (or keep client-side ExcelJS) |
| `business/equipmentImport.parseEquipmentWorkbook` | Prefer server-side parse on upload |
| `business/equipmentImport.importEquipmentRows` | Same as batch import |

## Bookings

| Business function | Suggested endpoint |
| --- | --- |
| `business/bookings.getBookingsForEquipment` | `GET /api/equipment/{id}/bookings` |
| `business/bookings.getBookingsForUser` | `GET /api/users/me/bookings` |
| `business/bookings.getAllBookings` | `GET /api/bookings` |
| `business/bookings.getBookingsForLab` | `GET /api/labs/{id}/bookings` |
| `business/bookings.getCalendarBookings` | Same routes with query filters |
| `business/bookings.getCalendarPeople` | `GET /api/users` (directory for the person filter) |
| `business/bookings.createBooking` / `createBookings` | `POST /api/equipment/{id}/bookings` (body: array of ranges) |

## Lab managers & trainers

| Business function | Suggested endpoint |
| --- | --- |
| `business/labManagers.getLabManagerProfiles` | `GET /api/lab-managers` |
| `business/labManagers.addLabManager` / `removeLabManager` | `POST/DELETE /api/lab-managers/{userId}` |
| `business/labManagers.setAssignedLabs` | `PUT /api/lab-managers/{userId}/labs` |
| `business/labManagers.getAssignedLabIds` | `GET /api/lab-managers/{userId}/labs` |
| `business/trainers.getTrainers` | `GET /api/trainers` |
| `business/trainers.addTrainer` / `removeTrainer` | `POST/DELETE /api/trainers/{userId}` |

## Trainings

| Business function | Suggested endpoint |
| --- | --- |
| `business/trainings.getAllTrainings` | `GET /api/trainings` |
| `business/trainings.getTraining` | `GET /api/trainings/{id}` |
| `business/trainings.addTraining` / `removeTraining` | `POST/DELETE /api/trainings[/{id}]` |
| `business/trainings.getTrainingCatalog` | `GET /api/trainings/catalog?…` |
| `business/trainings.getTrainingRecordsForUser` | `GET /api/users/me/trainings` |
| `business/trainings.addTrainingsFromEquipment` | `POST /api/equipment/{id}/enroll-trainings` |
| `business/trainings.requestTrainingAccess` | `POST /api/trainings/{id}/access-requests` |
| `business/trainings.getTrainingRequestReviews` | `GET /api/training-access-requests` |
| `business/trainings.approveTrainingRequest` / `denyTrainingRequest` | `POST /api/training-access-requests/{id}/approve\|deny` |
| `business/trainings.canReviewRequest` | Server-side only (not a public route) |

## Consumables & notifications

| Business function | Suggested endpoint |
| --- | --- |
| `business/consumables.getConsumablesForLab` | `GET /api/labs/{id}/consumables` |
| `business/consumables.getConsumablesForEquipment` | `GET /api/equipment/{id}/consumables` |
| `business/consumables.addConsumable` | `POST /api/consumables` |
| `business/consumables.setConsumableLowNotify` | `PATCH /api/consumables/{id}` |
| `business/consumables.reportConsumableLow` / `clearConsumableLow` | `POST /api/consumables/{id}/report-low\|restock` |
| `business/consumables.removeConsumable` | `DELETE /api/consumables/{id}` |
| `business/notifications.getNotificationsForUser` | `GET /api/notifications` |
| `business/notifications.getUnreadNotificationCount` | `GET /api/notifications/unread-count` |
| `business/notifications.markNotificationRead` | `POST /api/notifications/{id}/read` |
| `business/notifications.markAllNotificationsRead` | `POST /api/notifications/read-all` |
| create\* notification helpers | Called internally by other endpoints |

## Activity & permissions

| Business function | Suggested endpoint |
| --- | --- |
| `business/activity.getActivities` | `GET /api/activity?…` (admin) |
| `business/activity.logActivity` | Server-side only on mutations |
| `business/permissions.*` | Server-side authorization helpers |

## Swap strategy

1. Create Azure SQL using the tables in `radiant-schema.dbml` / `radiant-tables.xlsx`.
2. Build API controllers that match the routes above.
3. In each file under `src/data/repositories/`, replace mock `store` access with `fetch`, one aggregate at a time.
4. Keep `npm run dev` working by pointing repositories at a local API or feature-flagging mock vs live.
