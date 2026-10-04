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
    { icon: <Phone className="h-5 w-5 text-blue-400" />, label: t("footer.phone"),
