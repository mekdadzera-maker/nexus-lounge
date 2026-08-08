import { isWithinOpenHours } from "./venue";

export function getCategory(station) {
  if (station.category === "Billiards") return "billiards";
  if (station.category === "PS5") return "ps5";
  if (station.category === "Forza") return "xbox";
  return "ps5";
}

export function tiersForStation(allTiers, station) {
  return allTiers.filter((t) => t.station_category === station.category);
}

export function qtyLabelFor() {
  return "Quantity";
}

function toMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function toHHMM(mins) {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function computeEndTime(startTime, durationMin, quantity = 1) {
  if (!durationMin || !startTime) return null;
  const start = toMinutes(startTime);
  if (start == null) return null;
  return toHHMM(start + durationMin * quantity);
}

export function hasConflict(newStart, newEnd, existing) {
  const ns = toMinutes(newStart);
  const ne = newEnd ? toMinutes(newEnd) : ns + 1;
  for (const b of existing) {
    const bs = toMinutes(b.start_time);
    const be = b.end_time ? toMinutes(b.end_time) : bs + 1;
    if (ns < be && ne > bs) return true;
  }
  return false;
}

export function generateReservationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `NX-${code}`;
}

export function validateOpenWindow(startTime, opening, closing) {
  if (!isWithinOpenHours(startTime, opening, closing)) {
    return `The venue is closed during this time slot. Please choose a time between ${opening} and ${closing}.`;
  }
  return null;
}