import React from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, Navigation, MessageCircle, Instagram } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { getOpenStatus } from "@/lib/venue";

function TikTokIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.59-1.16-2.59-2.5 0-1.46 1.33-2.55 2.86-2.46V9.72c-3.13-.25-5.75 2.1-5.75 5.18 0 2.9 2.36 5.1 5.33 5.1 3.13 0 5.32-2.2 5.32-5.1V9.4a7.2 7.2 0 0 0 4.03 1.22V7.35c-1.1 0-1.95-.37-2.65-1.53z" />
    </svg>
  );
}

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

  const links = [
    { icon: <Phone className="h-4 w-4" />, label: t("contact.callNow"), href: "tel:0791744734", primary: true },
    { icon: <Navigation className="h-4 w-4" />, label: t("contact.directions"), href: MAPS_DIR },
    { icon: <MessageCircle className="h-4 w-4" />, label: "Facebook", href: "https://www.facebook.com/profile.php?id=61574316214792" },
    { icon: <Instagram className="h-4 w-4" />, label: "Instagram", href: "https://www.instagram.com/qlf_gaming0/" },
    { icon: <TikTokIcon className="h-4 w-4" />, label: "TikTok", href: "https://www.tiktok.com/@qlf_gaming0" },
  ];

  return (
    <section id="contact" className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">{t("footer.contact")}</p>
        <h2 className="mt-2 font-heading text-4xl font-bold text-white sm:text-5xl">{t("contact.title")}</h2>
        <p className="mt-3 text-white/50">{t("contact.sub")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

          <div className="mt-7 flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith("tel:") ? undefined : "_blank"}
                rel={l.href.startsWith("tel:") ? undefined : "noreferrer"}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  l.primary
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {l.icon} {l.label}
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 lg:h-auto"
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
