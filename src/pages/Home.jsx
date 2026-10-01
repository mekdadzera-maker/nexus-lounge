import { supabase } from "@/lib/supabaseClient";

import React, {useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Circle, Gamepad2, Gauge, WifiOff } from "lucide-react";

import Hero from "@/components/lounge/Hero";
import StationCard from "@/components/lounge/StationCard";
import BookingForm from "@/components/lounge/BookingForm";
import ConfirmationModal from "@/components/lounge/ConfirmationModal";
import Footer from "@/components/lounge/Footer";
import Navbar from "@/components/lounge/Navbar";
import GuestPrompt from "@/components/lounge/GuestPrompt";
import SessionAlarmNotifier from "@/components/lounge/SessionAlarmNotifier";
import ContactSection from "@/components/ContactSection";
import SupportChatWidget from "@/components/lounge/SupportChatWidget";
import { useAuth } from "@/lib/AuthContext";
import { tiersForStation } from "@/lib/pricing";
import { useLang } from "@/lib/i18n";

const FILTERS = [
  { key: "billiards", labelKey: "filter.billiards" },
  { key: "gaming", labelKey: "filter.gaming" },
];

function matchLevel(station, filter) {
  if (filter === "all") return true;
  if (filter === "billiards") return station.level === "Billiards";
  return station.level === "Gaming";
}

export default function Home() {
  const { t } = useLang();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("billiards");
  const [bookingStation, setBookingStation] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [guestStation, setGuestStation] = useState(null);
  const [settings, setSettings] = useState(null);
  const [tiers, setTiers] = useState([]);
  const stationsRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    supabase.from("stations").select("*")
      .then(({ data }) => setStations(data || []))
      .finally(() => setLoading(false));

    supabase.from("venue_settings").select("*")
      .then(({ data }) => setSettings(data?.[0] || null));

    supabase.from("pricing_tiers").select("*")
      .then(({ data }) => setTiers(data || []));
  }, []);

  const handleBook = (station) => {
    if (!isAuthenticated) setGuestStation(station);
    else setBookingStation(station);
  };
  const scrollToStations = () =>
    stationsRef.current?.scrollIntoView({ behavior: "smooth" });

  const filtered = stations.filter((s) => matchLevel(s, filter));
  const billiards = filtered.filter((s) => s.level.includes("Billiards"));
  const gaming = filtered.filter((s) => s.level.includes("Gaming"));
  const stats = {
    total: stations.length,
    ps5: stations.filter((s) => s.category === "PS5").length,
    billiards: stations.filter((s) => s.level === "Billiards").length,
  };

  return (
    <div className="min-h-screen bg-[#08080a]">
      {isOffline && (
        <div className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-black">
          <WifiOff className="h-4 w-4" />
          You're offline — showing saved info. Booking needs a connection.
        </div>
      )}
      <Navbar onReserve={scrollToStations} />
      <Hero onBook={scrollToStations} settings={settings} stats={stats} />

      {/* Stations section */}
      <section ref={stationsRef} id="stations" className="mx-auto max-w-7xl px-6 py-20">
        {/* Section header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">{t("home.avail")}</p>
          <h2 className="mt-2 font-heading text-4xl font-bold text-white sm:text-5xl">{t("home.pick")}</h2>
          <p className="mt-3 text-white/50">{t("home.pickSub")}</p>
        </div>

        {/* Filter tabs */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                  filter === f.key ? "bg-white text-[#08080a]" : "text-white/60 hover:text-white"
                }`}
              >
                {t(f.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-blue-400" />
          </div>
        ) : (
          <>
            {/* Billiards level */}
            {(filter === "all" || filter === "billiards") && billiards.length > 0 && (
              <LevelBlock
                icon={<Circle className="h-5 w-5 text-amber-400" />}
                title={t("lvl.billiards")}
                subtitle={t("lvl.billiardsSub")}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {billiards.map((s, i) => (
                    <StationCard key={s.id} station={s} tiers={tiersForStation(tiers, s)} onBook={handleBook} index={i} />
                  ))}
                </div>
              </LevelBlock>
            )}

            {/* Gaming level */}
            {(filter === "all" || filter === "gaming") && gaming.length > 0 && (
              <LevelBlock
                icon={<Gamepad2 className="h-5 w-5 text-blue-400" />}
                title={t("lvl.gaming")}
                subtitle={t("lvl.gamingSub")}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {gaming.map((s, i) => (
                    <StationCard key={s.id} station={s} tiers={tiersForStation(tiers, s)} onBook={handleBook} index={i} />
                  ))}
                </div>
              </LevelBlock>
            )}
          </>
        )}
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden border-y border-white/10 bg-gradient-to-r from-blue-950/30 via-[#08080a] to-emerald-950/30">
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
          <Gauge className="mx-auto h-10 w-10 text-emerald-400" />
          <h2 className="mt-4 font-heading text-3xl font-bold text-white sm:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mt-3 text-white/60">
            {t("cta.sub")}
          </p>
          <button
            onClick={scrollToStations}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-[#08080a] transition hover:bg-blue-400 hover:text-white"
          >
            <Gamepad2 className="h-5 w-5" /> {t("cta.browse")}
          </button>
        </div>
      </section>

      <ContactSection settings={settings} />
      <Footer />

      {/* Modals */}
      <GuestPrompt
        station={guestStation}
        onClose={() => setGuestStation(null)}
        onGuest={() => {
          setBookingStation(guestStation);
          setGuestStation(null);
        }}
      />
      <BookingForm
        key={bookingStation?.id || "none"}
        station={bookingStation}
        tiers={bookingStation ? tiersForStation(tiers, bookingStation) : []}
        settings={settings}
        user={user}
        onClose={() => setBookingStation(null)}
        onConfirmed={(b) => {
          setBookingStation(null);
          setConfirmation(b);
        }}
      />
      <ConfirmationModal booking={confirmation} onClose={() => setConfirmation(null)} />
      <SessionAlarmNotifier /> <SupportChatWidget />
    </div>
  );
}

function LevelBlock({ icon, title, subtitle, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="mb-16"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          {icon}
        </div>
        <div>
          <h3 className="font-heading text-xl font-bold text-white">{title}</h3>
          <p className="text-sm text-white/50">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}
