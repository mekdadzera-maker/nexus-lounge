import React from "react";
import { Instagram, Phone, MapPin, Clock } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-white/10 bg-[#08080a]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="font-heading text-2xl font-extrabold tracking-tight text-white">
              NEXUS<span className="text-blue-400">.</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
              {t("footer.tag")}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">{t("footer.contact")}</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-blue-400" />
                <a href="tel:0554026108" className="hover:text-white">0554 02 61 08</a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>6977+2F Sidi Bel Abbès</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>{t("hero.open")} · {t("hero.closes")} 3 AM</span>
              </li>
              <li className="flex items-center gap-3">
                <Instagram className="h-4 w-4 text-pink-400" />
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white">@nexus.lounge</a>
              </li>
            </ul>
          </div>

          {/* Levels */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">{t("footer.features")}</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>🎱 Upper Level — Billiards Lounge</li>
              <li>🎮 Lower Level — Gaming Salle</li>
              <li>🏎️ 2 Forza Sim-Racing Pods</li>
              <li>🕹️ 9 PS5 Sofa Stations</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} NEXUS Lounge · {t("nav.location")}. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}