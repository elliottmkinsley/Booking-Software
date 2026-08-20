/**
 * Labels for how finely a piece of equipment can be reserved
 * (half-hour, hourly, daily, or weekly). Software does not use this.
 */
import type { RentalGranularity } from "../types";

export const RENTAL_GRANULARITY_OPTIONS: {
  value: RentalGranularity;
  label: string;
  hint: string;
}[] = [
  {
    value: "30min",
    label: "30 minutes",
    hint: "Reserved in half-hour slots",
  },
  {
    value: "hourly",
    label: "Hourly",
    hint: "Reserved in one-hour slots",
  },
  {
    value: "daily",
    label: "Daily",
    hint: "Reserved by calendar day",
  },
  {
    value: "weekly",
    label: "Weekly",
    hint: "Reserved in week-long blocks",
  },
];

export const RENTAL_GRANULARITY_LABELS: Record<RentalGranularity, string> = {
  "30min": "30 minutes",
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
};
