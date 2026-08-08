const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Gamepad2, Clock, Calendar, Loader2, Receipt, ChevronRight } from "lucide-react";

import Navbar from "@/components/lounge/Navbar";
import Footer from "@/components/lounge/Footer";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";

const PAYMENT_STYLES = {
  Pending: "bg-amber-500/15 text-amber-300",
  "Deposit Paid": "bg-blue-500/15 text-blue-300",
  Completed: "bg-emerald-500/15 text-emerald-300",
};

export default function MyBookings() {
  const { t } = useLang();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    db.entities.Bookings.filter({ created_by_id: user.id }, "-created_date", 100)
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => (b.booking_date || "") >= todayStr).reverse();
  const past = bookings.filter((b) => (b.booking_date || "") < todayStr);

  return (
    <div className="min-h-screen bg-[#08080a]">
      <Navbar onReserve={() => window.location.assign("/")} />

      <section className="mx-auto max-w-4xl px-6 pb-20 pt-28">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">{t("nav.bookings")}</p>
          <h1 className="mt-2 font-heading text-4xl font-bold text-white">{t("mb.title")}</h1>
          <p className="mt-2 text-white/50">{t("mb.sub")}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-white/40" /></div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <Gamepad2 className="mx-auto h-10 w-10 text-white/30" />
            <p className="mt-4 text-white/60">{t("mb.empty")}</p>
            <Link to="/" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400">
              {t("nav.reserve")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <Group title={t("mb.upcoming")} items={upcoming} t={t} />
            {past.length > 0 && <Group title={t("mb.past")} items={past} t={t} muted />}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function Group({ title, items, t, muted }) {
  if (!items.length) return null;
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">{title}</h2>
      <div className="space-y-3">
        {items.map((b) => (
          <div key={b.id} className={`rounded-2xl border border-white/10 bg-white/5 p-5 ${muted ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                  <Gamepad2 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{b.station_name}</p>
                  <p className="text-xs text-white/40">{b.booking_mode}</p>
                </div>
              </div>
              <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${PAYMENT_STYLES[b.payment_status] || "bg-white/10 text-white/60"}`}>
                {b.payment_status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Info icon={<Calendar className="h-4 w-4" />} label={t("conf.date")} value={b.booking_date} />
              <Info icon={<Clock className="h-4 w-4" />} label={t("conf.time")} value={b.end_time ? `${b.start_time} – ${b.end_time}` : b.start_time} />
              <Info icon={<Receipt className="h-4 w-4" />} label={t("conf.code")} value={b.reservation_code} mono />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-xs text-white/40">{t("conf.qty")}: {b.booking_quantity} · {t("mb.contact")}: {b.contact_method}</span>
              <span className="font-heading text-lg font-bold text-emerald-400">{b.total_price} <span className="text-xs text-white/50">DA</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ icon, label, value, mono }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40">{icon} {label}</p>
      <p className={`mt-0.5 text-sm font-medium text-white ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}