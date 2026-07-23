# Instructions for AI agents

Before working in this workspace, read the files in `memory/` - they contain
accumulated knowledge about this project, its architecture conventions, and the
user's workflow preferences. Start with `memory/workspace-overview.md`.

When you learn something important during a session (a decision the user made,
a convention that was established, a gotcha you hit), document it in `memory/`
so future sessions benefit. Update existing files where the topic fits, or add
a new topic-specific markdown file.

Key conventions to respect (details in memory folder):
- All data access goes through `src/services/` so the mock store can be swapped
  for an Azure-backed API later without touching pages/components.
- The app must remain testable locally with `npm run dev`.
