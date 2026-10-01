import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, Calendar, Clock, Gamepad2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { localizedName } from "@/lib/stationI18n";

export default function ConfirmationModal({ booking, onClose }) {
  const { t, lang } = useLang();
  if (!booking) return null;
  const station = booking.station || {};
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="scrollbar-thin relative w-full max-w-md max-h-[85vh] overflow-y-auto overscroll-contain rounded-3xl border border-emerald-500/30 bg-[#0c0f0d] p-7 glow-green"
        >
          <button
            onClick={onClose}
            className="sticky top-0 float-right -mt-1 -mr-1 z-10 rounded-lg bg-[#0c0f0d] p-1 text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", damping: 12 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"
            >
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
            </motion.div>
            <h3 className="mt-4 font-heading text-2xl font-bold text-white">{t("conf.title")}</h3>
            <p className="mt-1 text-sm text-white/50">{t("conf.sub")}</p>

            {/* Receipt code */}
            <div className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-center">
              <p className="text-xs uppercase tracking-wider text-white/40">{t("conf.code")}</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-emerald-400">
                {booking.reservation_code}
              </p>
            </div>

            {/* Details */}
            <div className="mt-4 w-full space-y-2.5 text-left">
              <Row icon={<Gamepad2 className="h-4 w-4" />} label={t("conf.station")} value={station.name} />
              <Row icon={<Calendar className="h-4 w-4" />} label={t("conf.date")} value={booking.booking_date} />
              <Row icon={<Clock className="h-4 w-4" />} label={t("conf.time")} value={booking.end_time ? `${booking.start_time} – ${booking.end_time}` : booking.start_time} />
              <Row icon={<Gamepad2 className="h-4 w-4" />} label={t("conf.mode")} value={booking.mode} />
              <Row icon={<Gamepad2 className="h-4 w-4" />} label={t("conf.qty")} value={String(booking.quantity)} />
            </div>

            {/* Total */}
            <div className="mt-5 flex w-full items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
              <span className="text-sm text-white/60">{t("conf.total")}</span>
              <span className="font-heading text-3xl font-bold text-emerald-400">
                {booking.total_due} <span className="text-base text-white/50">DA</span>
              </span>
            </div>

            <p className="mt-4 text-xs text-white/40">Payment pending at the venue. Please arrive 5 minutes before your slot.</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
      <span className="flex items-center gap-2 text-sm text-white/50">
        {icon} {label}
      </span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
