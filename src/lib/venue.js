// Venue operating-hours helpers (supports overnight windows like 10:00 → 03:00)

function toMin(t) {
  if (!t) return null;
  const parts = String(t).split(":").map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

export function isWithinOpenHours(timeStr, opening, closing) {
  const t = toMin(timeStr);
  const o = toMin(opening);
  const c = toMin(closing);
  if (t == null || o == null || c == null) return true;
  if (c > o) return t >= o && t < c;   // same-day window
  return t >= o || t < c;              // overnight window
}

export function getOpenStatus(opening, closing) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const nowStr = `${hh}:${mm}`;
  return { open: isWithinOpenHours(nowStr, opening, closing), nowStr };
}