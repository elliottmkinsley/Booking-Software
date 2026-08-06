import type {
  ActivityAction,
  ActivityEvent,
  User,
  UserRole,
} from "../types";
import { nextId, persist, store } from "./mockStore";

// MOCK IMPLEMENTATION - when the API exists, logging moves server-side
// (each mutating endpoint writes its own audit row) and getActivities
// becomes a fetch() against an admin-only endpoint.

export type ActivitySort =
  | "lastUsed"
  | "oldest"
  | "actor"
  | "role";

export interface ActivityQuery {
  /** Filter to one actor role, or "all". */
  role?: UserRole | "all";
  /** Filter to one action type, or "all". */
  action?: ActivityAction | "all";
  /** Case-insensitive substring match on actor username. */
  actorSearch?: string;
  sort?: ActivitySort;
  /**
   * When true, return only each actor's most recent event
   * (useful for "who last used the app" views).
   */
  uniqueActors?: boolean;
}

/**
 * Records an audit entry. Called by other services after a successful
 * mutation - components should never call this directly.
 */
export function logActivity(
  actor: User,
  action: ActivityAction,
  summary: string
): void {
  store.activities.push({
    id: nextId("act"),
    timestamp: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.username,
    actorRole: actor.role,
    action,
    summary,
  });
  persist();
}

const ROLE_ORDER: Record<UserRole, number> = {
  admin: 0,
  labOwner: 1,
  user: 2,
};

function uniqueByActor(events: ActivityEvent[]): ActivityEvent[] {
  const seen = new Set<string>();
  // Assume events are already newest-first when calling this.
  return events.filter((event) => {
    if (seen.has(event.actorId)) return false;
    seen.add(event.actorId);
    return true;
  });
}

export async function getActivities(
  query: ActivityQuery = {}
): Promise<ActivityEvent[]> {
  const {
    role = "all",
    action = "all",
    actorSearch = "",
    sort = "lastUsed",
    uniqueActors = false,
  } = query;

  const search = actorSearch.trim().toLowerCase();

  let events = store.activities.filter(
    (event) =>
      (role === "all" || event.actorRole === role) &&
      (action === "all" || event.action === action) &&
      (search === "" || event.actorName.toLowerCase().includes(search))
  );

  // Always start from newest so uniqueActors keeps the latest per user.
  events = events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (uniqueActors) {
    events = uniqueByActor(events);
  }

  return events.sort((a, b) => {
    if (sort === "actor") {
      return (
        a.actorName.localeCompare(b.actorName) ||
        b.timestamp.localeCompare(a.timestamp)
      );
    }
    if (sort === "role") {
      return (
        ROLE_ORDER[a.actorRole] - ROLE_ORDER[b.actorRole] ||
        b.timestamp.localeCompare(a.timestamp)
      );
    }
    if (sort === "oldest") {
      return a.timestamp.localeCompare(b.timestamp);
    }
    // lastUsed / newest
    return b.timestamp.localeCompare(a.timestamp);
  });
}
