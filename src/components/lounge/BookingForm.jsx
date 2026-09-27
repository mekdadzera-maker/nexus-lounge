import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, User, Phone, AlertCircle, Loader2, Check, Minus, Plus, Facebook } from "lucide-react";
import { generateReservationCode } from "@/lib/pricing";
import { isWithinOpenHours } from "@/lib/venue";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";

export default function BookingForm({ station, tiers, settings, user, onClose, onConfirmed }) {
  const { t } = useLang();
  const list = tiers || [];
  const [name, setName] = useState("");
  const [contactMethod, setContactMethod] = useState("Phone");
  const [contactValue, setContactValue] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [mode, setMode] = useState(() => tiers?.[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedTier = list.find((t) => t.id === mode);

  useEffect(() => {
    if (list.length) setMode(list[0].id);
  }, [list]);

  useEffect(() => {
    setQuantity(1);
  }, [mode]);

  if (!station) return null;

  const total = (selectedTier?.price || 0) * quantity;
  const qtyLabel = "Quantity";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !contactValue.trim() || !date || !startTime || !selectedTier) {
      setError(t("bk.fillAll") || "Please fill all fields.");
      return;
    }
    if (quantity < 1) {
      setError(t("bk.qtyMin") || "Quantity must be at least 1.");
      return;
    }
    if (settings?.hours && !isWithinOpenHours(startTime, "10:00", "03:00")) {
      // Simplified open-hours check; adjust as needed
    }
    setSubmitting(true);
    try {
      const code = generateReservationCode();
      const { data, error: insertError } = await supabase
        .from("bookings")
        .insert({
          station_id: station.id,
          full_name: name.trim(),
          contact_method: contactMethod,
          contact_value: contactValue.trim(),
          booking_date: date,
          start_time: startTime,
          mode: selectedTier.label,
          quantity: quantity,
          total_due: total,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onConfirmed({ ...data, station, reservation_code: code });
    } catch (err) {
      console.error(err);
      setError(t("bk.error") || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="scrollbar-thin max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101012] p-6 sm:rounded-3xl"
        >
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40">{t("bk.reserving") || "Reserving"}</p>
              <h3 className="font-heading text-xl font-bold text-white">{station.name}</h3>
              <p className="text-sm text-white/50">{station.level}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field icon={<User className="h-4 w-4" />} label={t("bk.name") || "Full Name"}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("bk.namePh") || "Your name"}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
              />
            </Field>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                {t("bk.contact") || "Contact Method"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Phone", "Facebook Messenger"].map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setContactMethod(m)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      contactMethod === m
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    }`}
                  >
                    {m === "Phone" ? <Phone className="h-4 w-4" /> : <Facebook className="h-4 w-4" />}
                    {m === "Phone" ? (t("bk.phone") || "Phone") : (t("bk.fb") || "Facebook")}
                  </button>
                ))}
              </div>
            </div>

            <Field icon={contactMethod === "Phone" ? <Phone className="h-4 w-4" /> : <Facebook className="h-4 w-4" />} label={contactMethod === "Phone" ? (t("bk.phoneLabel") || "Phone Number") : (t("bk.fbLabel") || "Facebook Profile Link")}>
              <input
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={contactMethod === "Phone" ? "05XX XX XX XX" : "https://facebook.com/username"}
                type={contactMethod === "Phone" ? "tel" : "url"}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field icon={<Calendar className="h-4 w-4" />} label={t("bk.date") || "Date"}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                />
              </Field>
              <Field icon={<Clock className="h-4 w-4" />} label={t("bk.start") || "Start Time"}>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                />
              </Field>
            </div>

            {list.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  {t("bk.mode") || "Booking Mode"}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {list.map((tier) => (
                    <button
                      type="button"
                      key={tier.id}
                      onClick={() => setMode(tier.id)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition ${
                        mode === tier.id
                          ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                      }`}
                    >
                      <span className="font-medium">{tier.label}</span>
                      <span className="font-semibold text-blue-300">{tier.price} DA</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTier && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  {qtyLabel}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-10 w-16 rounded-xl border border-white/10 bg-white/5 px-3 text-center text-sm font-semibold text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="ml-auto text-sm text-white/40">
                    {selectedTier.price} × {quantity}
                  </span>
                </div>
              </div>
            )}

            {selectedTier && (
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm text-white/60">{t("bk.total") || "Total Due"}</span>
                <span className="font-heading text-2xl font-bold text-white">
                  {total} <span className="text-sm text-white/50">DA</span>
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-base font-semibold text-[#08080a] transition hover:bg-blue-400 hover:text-white disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> {t("bk.confirming") || "Confirming..."}
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" /> {t("bk.confirm") || "Confirm Reservation"}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ icon, label, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
      <label className="mb-0.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
