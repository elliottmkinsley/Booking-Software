/**
 * Audit trail rows. Filtering/sorting stays in business.
 */
import type { ActivityEvent } from "../../shared/types";
import { nextId, persist, store } from "../mockStore";

export async function listActivities(): Promise<ActivityEvent[]> {
  return [...store.activities];
}

export function recordActivity(
  input: Omit<ActivityEvent, "id" | "timestamp">
): ActivityEvent {
  const event: ActivityEvent = {
    id: nextId("act"),
    timestamp: new Date().toISOString(),
    ...input,
  };
  store.activities.push(event);
  persist();
  return event;
}
