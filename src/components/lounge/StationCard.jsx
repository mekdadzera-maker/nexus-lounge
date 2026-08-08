import React from "react";
import { motion } from "framer-motion";
import { Gamepad2, Gauge, Circle } from "lucide-react";
import { getCategory } from "@/lib/pricing";
import { useLang } from "@/lib/i18n";
import { localizedName, localizedNotes, localizedTierName } from "@/lib/stationI18n";

const THEME = {
  billiards: {
    border: "border-amber-500/30",
    glow: "glow-gold",
    accent: "text-amber-400",
    chipBg: "bg-amber-500/10",
    chipText: "text-amber-300",
    gradient: "from-amber-950/40 to-[#0c0c0e]",
    icon: <Circle className="h-5 w-5" />,
  },
  ps5: {
    border: "border-blue-500/30",
    glow: "glow-blue",
    accent: "text-blue-400",
    chipBg: "bg-blue-500/10",
    chipText: "text-blue-300",
    gradient: "from-blue-950/40 to-[#0c0c0e]",
    icon: <Gamepad2 className="h-5 w-5" />,
  },
  xbox: {
    border: "border-emerald-500/30",
    glow: "glow-green",
    accent: "text-emerald-400",
    chipBg: "bg-emerald-500/10",
    chipText: "text-emerald-300",
    gradient: "from-emerald-950/40 to-[#0c0c0e]",
    icon: <Gauge className="h-5 w-5" />,
  },
};

export default function StationCard({ station, tiers, onBook, index }) {
  const { t, lang } = useLang();
  const cat = getCategory(station);
  const theme = THEME[cat];
  const list = tiers || [];
  const available = station.status === "Available";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
      className={`group relative overflow-hidden rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.gradient} p-5 ${theme.glow} transition hover:scale-[1.02] hover:border-white/30`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`${theme.accent}`}>{theme.icon}</span>
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">
            {station.station_code}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            available ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-emerald-400" : "bg-red-400"}`} />
          {available ? t("card.available") : t("card.reserved")}
        </span>
      </div>

      <h3 className="mt-3 font-heading text-xl font-bold text-white">{localizedName(station, lang)}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-white/50">{localizedNotes(station, lang)}</p>

      {/* Pricing chips */}
      {list.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {list.map((tier) => (
  <span
    key={tier.id}
    className={`rounded-lg ${theme.chipBg} ${theme.chipText} px-2.5 py-1 text-xs font-medium`}
  >
    {tier.label} · {tier.price} DA
  </span>
))}
        </div>
      )}

      <button
        onClick={() => available && onBook(station)}
        disabled={!available}
        className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
          available
            ? `bg-white/10 text-white hover:bg-white/20`
            : "cursor-not-allowed bg-white/5 text-white/30"
        }`}
      >
        {available ? t("card.book") : t("card.unavail")}
      </button>
    </motion.div>
  );
}