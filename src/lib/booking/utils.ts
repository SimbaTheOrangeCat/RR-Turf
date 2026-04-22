import { SLOT_DURATION_MINUTES } from "./constants";

export function toDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getTodayDateString() {
  return toDateString(new Date());
}

export function buildHourlySlots() {
  const slots: { start: string; end: string }[] = [];
  const operatingHours = [
    6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1,
  ];

  for (const hour of operatingHours) {
    const start = `${String(hour).padStart(2, "0")}:00:00`;
    const endHour = (hour + SLOT_DURATION_MINUTES / 60) % 24;
    const end = `${String(endHour).padStart(2, "0")}:00:00`;

    slots.push({ start, end });
  }

  return slots;
}

export function buildDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate || startDate > endDate) {
    return [] as string[];
  }

  const result: string[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (current <= end) {
    result.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}

export function buildCustomHourlySlots(startHour: number, endHour: number) {
  if (
    Number.isNaN(startHour) ||
    Number.isNaN(endHour) ||
    startHour < 0 ||
    startHour > 23 ||
    endHour < 1 ||
    endHour > 24 ||
    startHour >= endHour
  ) {
    return [] as { start: string; end: string }[];
  }

  const slots: { start: string; end: string }[] = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    const start = `${String(hour).padStart(2, "0")}:00:00`;
    const end = `${String((hour + 1) % 24).padStart(2, "0")}:00:00`;
    slots.push({ start, end });
  }

  return slots;
}

export function formatTime(time: string) {
  const [hourRaw, minuteRaw] = time.split(":");
  const hourNum = Number(hourRaw);
  const minute = minuteRaw ?? "00";
  const period = hourNum >= 12 ? "PM" : "AM";
  const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${hour12}:${minute} ${period}`;
}
