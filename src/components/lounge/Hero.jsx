import React from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, ChevronDown, Gamepad2, Zap } from "lucide-react";
import { getOpenStatus } from "@/lib/venue";
import { useLang } from "@/lib/i18n";

export default function Hero({ onBook, settings, stats }) {
  const { t } = useLang();
  const rating = settings?.current_rating ?? 5.0;
  const openingTime = settings?.opening_time || "17:00";
  const closingTime = settings?.closing_time || "04:00";
  const closingLabel = settings?.display_closing_string || "4 AM";
  const { open } = getOpenStatus(openingTime, closingTime);
  const stationsLive = stats?.total ?? 13;

  return (
    <header className="relative min-h-[100svh] overflow-hidden bg-[#08080a]">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80"
          alt="Gaming lounge"
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080a]/60 via-[#08080a]/80 to-[#08080a]" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>

      {/* Glow orbs */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-white/80">
              {Number(rating).toFixed(1)} {t("hero.badge")}
            </span>
          </div>

          <h1 className="font-heading text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
            {t("hero.t1")}
            <br />
            <span className="text-glow-blue text-blue-400">{t("hero.t2")}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            {t("hero.sub")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onBook}
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-[#08080a] transition hover:bg-blue-400 hover:text-white"
            >
              <Gamepad2 className="h-5 w-5" />
              {t("hero.book")}
            </button>
            <a
              href="#stations"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              {t("hero.explore")}
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>

          {/* Quick info */}
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <span className="inline-flex items-center gap-2 text-white/60">
              <MapPin className="h-4 w-4 text-blue-400" /> 69C6+5W {t("nav.location")}
            </span>
            <span className={`inline-flex items-center gap-2 ${open ? "text-emerald-400" : "text-red-400"}`}>
              <Clock className="h-4 w-4" />
              {open ? `🟢 ${t("hero.open")} · ${t("hero.closes")} ${closingLabel}` : `🔴 ${t("hero.closed")} · ${t("hero.opens")} ${openingTime}`}
            </span>
            <span className="inline-flex items-center gap-2 text-white/60">
              <Zap className="h-4 w-4 text-amber-400" /> {stationsLive} {t("hero.stationsLive")}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Stats strip */}
      <div className="relative border-t border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 md:grid-cols-4">
          {[
            { value: stats?.total ?? 13, label: t("stat.stations") },
            { value: 2, label: t("stat.levels") },
            { value: stats?.ps5 ?? 9, label: t("stat.ps5") },
            { value: stats?.billiards ?? 2, label: t("stat.billiards") },
          ].map((s) => (
            <div key={s.label} className="px-6 py-5 text-center">
              <div className="font-heading text-3xl font-bold text-white">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
