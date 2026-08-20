/**
 * Audit trail: record an event after a successful change, and query the log.
 */
import { recordActivity, listActivities } from "../data/repositories/activities";
import type {
  ActivityAction,
  ActivityEvent,
  User,
  UserRole,
} from "../shared/types";

export type ActivitySort = "lastUsed" | "oldest" | "actor" | "role";

export interface ActivityQuery {
  role?: UserRole | "all";
  action?: ActivityAction | "all";
  actorSearch?: string;
  sort?: ActivitySort;
  uniqueActors?: boolean;
}

/**
 * Records an audit entry. Called by other business modules after a successful
 * mutation — presentation should never call this directly.
 */
export function logActivity(
  actor: User,
  action: ActivityAction,
  summary: string
): void {
  recordActivity({
    actorId: actor.id,
    actorName: actor.username,
    actorRole: actor.role,
    action,
    summary,
  });
}

const ROLE_ORDER: Record<UserRole, number> = {
  admin: 0,
  labOwner: 1,
  user: 2,
};

function uniqueByActor(events: ActivityEvent[]): ActivityEvent[] {
  const seen = new Set<string>();
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

  let events = (await listActivities()).filter(
    (event) =>
      (role === "all" || event.actorRole === role) &&
      (action === "all" || event.action === action) &&
      (search === "" || event.actorName.toLowerCase().includes(search))
  );

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
    return b.timestamp.localeCompare(a.timestamp);
  });
}
