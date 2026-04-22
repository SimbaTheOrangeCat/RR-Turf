export const DEFAULT_SLOT_START_HOUR = 6;
export const DEFAULT_SLOT_END_HOUR = 23;
export const SLOT_DURATION_MINUTES = 60;

export const SLOT_STATUSES = ["available", "booked", "blocked"] as const;
export type SlotStatus = (typeof SLOT_STATUSES)[number];

export const BOOKING_STATUSES = ["active", "cancelled", "modified"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
