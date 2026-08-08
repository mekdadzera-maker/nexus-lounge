// Localizes stored station data (names, notes, tier names, level) into Arabic
// when the active language is "ar". English falls back to the stored value.
import { getCategory } from "./pricing";

const TIER_AR = {
  hour: "ساعة",
  game: "لعبة",
  "per game": "لعبة",
  "per hour": "ساعة",
  "time block": "فترة",
  match: "مباراة",
  "1v1": "1 ضد 1",
  "2v2": "2 ضد 2",
  "1v1 match": "مباراة 1 ضد 1",
  "2v2 match": "مباراة 2 ضد 2",
};

export function localizedName(station, lang) {
  const n = (station?.name || "").trim();
  if (lang !== "ar" || !n) return n;
  let m = n.match(/Billiard Table\s*(.*)/i);
  if (m) return `طاولة بلياردو ${m[1]}`.trim();
  m = n.match(/Sofa Station\s*(\d+)/i);
  if (m) return `أريكة PS5 رقم ${m[1]}`;
  if (/forza|sim[- ]?racing/i.test(n)) return "كبسولة فورزا للمحاكاة";
  if (/xbox/i.test(n)) return "كبسولة Xbox";
  return n;
}

export function localizedNotes(station, lang) {
  if (lang !== "ar") return station?.hardware_notes;
  const cat = getCategory(station);
  if (cat === "billiards") return "طاولة بلياردو بمقاس احترافي في الطابق العلوي.";
  if (cat === "ps5") return "أريكة PS5 مريحة في الطابق السفلي مع شاشة كبيرة.";
  if (cat === "xbox") return "كبسولة فورزا للمحاكاة بقيادة عالية الدقة.";
  return station?.hardware_notes;
}

export function localizedTierName(tier, lang) {
  const name = tier?.name || "";
  if (lang !== "ar") return name;
  const key = name.toLowerCase().trim();
  if (TIER_AR[key]) return TIER_AR[key];
  return tier?.is_match_based ? `مباراة · ${name}` : `ساعة · ${name}`;
}

export function localizedLevel(station, lang) {
  const lvl = station?.level || "";
  if (lang !== "ar") return lvl;
  if (/billiards/i.test(lvl)) return "الطابق العلوي — صالة البلياردو";
  if (/gaming/i.test(lvl)) return "الطابق السفلي — صالة الألعاب";
  return lvl;
}