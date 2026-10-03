import React from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, Navigation, MessageCircle } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { getOpenStatus } from "@/lib/venue";
import { Phone, MapPin, Clock, Navigation, MessageCircle, Instagram } from "lucide-react";

const POSITION = "35.2204436,-0.6377016";
const MAPS_DIR = "https://www.google.com/maps/dir/?api=1&destination=35.2204436,-0.6377016";
const MAPS_EMBED = `https://maps.google.com/maps?q=NEXUS+Lounge@${POSITION}&z=17&output=embed`;

export default function ContactSection({ settings }) {
  const { t } = useLang();
  const openingTime = settings?.opening_time || "10:00";
  const closingTime = settings?.closing_time || "03:00";
  const closingLabel = settings?.display_closing_string || "3 AM";
  const { open } = getOpenStatus(openingTime, closingTime);

  const rows = [
    { icon: <Phone className="h-5 w-5 text-blue-400" />, label: t("footer.phone"), value: "0791744734", href: "tel:0791744734" },
    { icon: <MapPin className="h-5 w-5 text-emerald-400" />, label: t("footer.loc"), value: t("contact.address") },
    {
      icon: <Clock className={`h-5 w-5 ${open ? "text-emerald-400" : "text-red-400"}`} />,
      label: t("footer.hours"),
      value: `${openingTime} – ${closingLabel}`,
    },
  ];

  return (
    <section id="contact" className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">{t("footer.contact")}</p>
        <h2 className="mt-2 font-heading text-4xl font-bold text-white sm:text-5xl">{t("contact.title")}</h2>
        <p className="mt-3 text-white/50">{t("contact.sub")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8"
        >
          <div className="space-y-5">
            {rows.map((r) => (
              <div key={r.label} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  {r.icon}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40">{r.label}</p>
                  {r.href ? (
                    <a href={r.href} className="text-lg font-semibold text-white hover:text-blue-400">{r.value}</a>
                  ) : (
                    <p className="text-lg font-semibold text-white">{r.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="tel:0791744734"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              <Phone className="h-4 w-4" /> {t("contact.callNow")}
            </a>
            <a
              href={MAPS_DIR}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Navigation className="h-4 w-4" /> {t("contact.directions")}
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61574316214792"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" /> Facebook
            </a>
            <a
              href="https://www.instagram.com/qlf_gaming0/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Instagram className="h-4 w-4" /> Instagram
            </a>
              <MessageCircle className="h-4 w-4" /> Facebook
            </a>
          </div>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-[340px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 lg:h-auto"
        >
          <iframe
            title="NEXUS Lounge location"
            src={MAPS_EMBED}
            className="h-full w-full grayscale invert-[0.92] hue-rotate-180 contrast-[0.95]"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </div>
    </section>
  );
}
