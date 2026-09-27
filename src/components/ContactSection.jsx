import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, Instagram, Send, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

export default function ContactSection({ settings }) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const closingLabel = settings?.display_closing_string || "4 AM";
  const openingTime = settings?.opening_time || "17:00";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !message.trim()) return;
    setStatus("sending");
    const { error } = await supabase.from("support_messages").insert({
      sender_name: name.trim(),
      contact_value: contact.trim(),
      content: message.trim(),
      source: "contact_form",
    });
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setName("");
    setContact("");
    setMessage("");
  };

  return (
    <section id="contact" className="relative overflow-hidden border-t border-white/10 bg-[#08080a]">
      {/* Glow orbs, matching Hero */}
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-1/3 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 max-w-2xl"
        >
          <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {t("contact.title")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            {t("contact.subtitle")}
          </p>
        </motion.div>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Info column */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <InfoRow icon={<Phone className="h-5 w-5 text-blue-400" />} label={t("footer.contact")}>
              <a href="tel:0791744734" className="hover:text-white">0791 74 47 34</a>
            </InfoRow>
            <InfoRow icon={<MapPin className="h-5 w-5 text-emerald-400" />} label={t("nav.location")}>
              69C6+5W Sidi Bel Abbès
            </InfoRow>
            <InfoRow icon={<Clock className="h-5 w-5 text-amber-400" />} label={t("hero.open")}>
              {openingTime} – {closingLabel}, {t("contact.daily")}
            </InfoRow>
            <InfoRow icon={<Instagram className="h-5 w-5 text-pink-400" />} label="Instagram">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white">
                @nexus.lounge
              </a>
            </InfoRow>
          </motion.div>

          {/* Form column */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">{t("contact.name")}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-[#101012] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400"
                placeholder={t("contact.namePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">{t("contact.reachYou")}</label>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-[#101012] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400"
                placeholder={t("contact.reachYouPlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">{t("contact.message")}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#101012] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400"
                placeholder={t("contact.messagePlaceholder")}
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {status === "sent" ? (
                <>
                  <Check className="h-4 w-4" /> {t("contact.sent")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> {status === "sending" ? t("contact.sending") : t("contact.send")}
                </>
              )}
            </button>

            {status === "error" && (
              <p className="text-sm text-red-400">{t("contact.error")}</p>
            )}
          </motion.form>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wider text-white/40">{label}</div>
        <div className="mt-1 text-sm text-white/80">{children}</div>
      </div>
    </div>
  );
}
