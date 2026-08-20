# Diagrams and Tables

This folder is the **blueprint for the future Azure SQL database**. The app
you click through today still uses fake data in the browser. These files are
what we will use when it is time to create real tables.

Open the tool-native files first (they stay in sync with the schema). The
markdown notes are extra explanation, not the source of truth.

| File | Open it with | What you get |
| --- | --- | --- |
| [`radiant-schema.dbml`](./radiant-schema.dbml) | [dbdiagram.io](https://dbdiagram.io) (File → Import DBML) | Interactive diagram of how tables connect |
| [`entity-relationship.drawio`](./entity-relationship.drawio) | [diagrams.net](https://app.diagrams.net) or the VS Code Draw.io extension | A layout you can tidy for slides |
| [`radiant-tables.xlsx`](./radiant-tables.xlsx) | Excel or Google Sheets | Every table and column, plus a roles matrix. Rebuild with `node scripts/build-schema-workbook.mjs` |

Supporting notes (plain English, not the schema itself):

- [`azure-migration-notes.md`](./azure-migration-notes.md) — what to merge or drop when leaving the mock (especially the three kinds of "person")
- [`service-api-map.md`](./service-api-map.md) — which `src/business/` function becomes which API route (swap implementations in `src/data/repositories/`)
- [`roles-and-permissions.md`](./roles-and-permissions.md) — who can do what (same matrix as the Excel Roles sheet)

## Suggested order

1. Import **`radiant-schema.dbml`** into dbdiagram.io to see the relationships.
2. Use **`radiant-tables.xlsx`** when creating Azure SQL tables or talking through columns with teammates.
3. Tweak **`entity-relationship.drawio`** if you need a slide-friendly picture (File → Export as PNG/PDF from diagrams.net).
