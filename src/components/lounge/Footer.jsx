import React from "react";
import { Instagram, Facebook, Phone, MapPin, Clock } from "lucide-react";
import { useLang } from "@/lib/i18n";

function TikTokIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.59-1.16-2.59-2.5 0-1.46 1.33-2.55 2.86-2.46V9.72c-3.13-.25-5.75 2.1-5.75 5.18 0 2.9 2.36 5.1 5.33 5.1 3.13 0 5.32-2.2 5.32-5.1V9.4a7.2 7.2 0 0 0 4.03 1.22V7.35c-1.1 0-1.95-.37-2.65-1.53z" />
    </svg>
  );
}

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-white/10 bg-[#08080a]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <svg viewBox="0 0 980 980" className="h-16 w-16" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                fill="#FFFFFF"
                d="M 366,303 L 226,395 L 226,550 L 276,594 L 278,624 L 281,629 L 313,646 L 334,637 L 365,658 Z
                   M 319,394 L 320,395 L 320,547 L 319,548 L 311,548 L 309,546 L 309,536 L 307,534 L 298,515 L 295,516 L 287,522 L 273,522 L 272,521 L 272,427 L 276,423 L 286,417 L 289,414 L 303,405 L 313,397 Z"
              />
              <path
                fill="#FFFFFF"
                d="M 443,244 L 398,279 L 398,679 L 487,735 L 576,683 L 576,567 L 531,567 L 529,654 L 485,678 L 443,651 Z"
              />
              <path
                fill="#FFFFFF"
                d="M 608,297 L 609,669 L 654,641 L 654,511 L 691,509 L 691,457 L 654,455 L 654,400 L 656,399 L 705,435 L 706,471 L 753,471 L 753,402 Z"
              />
            </svg>
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
                <a href="tel:0791744734" className="hover:text-white">0791 74 47 34</a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>69C6+5W Sidi Bel Abbès</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>{t("hero.open")} · {t("hero.closes")} 4 AM</span>
              </li>
              <li className="flex items-center gap-3">
                <Instagram className="h-4 w-4 text-pink-400" />
                <a href="https://www.instagram.com/qlf_gaming0/" target="_blank" rel="noreferrer" className="hover:text-white">@qlf_gaming0</a>
              </li>
              <li className="flex items-center gap-3">
                <Facebook className="h-4 w-4 text-blue-500" />
                <a href="https://www.facebook.com/profile.php?id=61574316214792" target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a>
              </li>
              <li className="flex items-center gap-3">
                <TikTokIcon className="h-4 w-4 text-white" />
                <a href="https://www.tiktok.com/@qlf_gaming0" target="_blank" rel="noreferrer" className="hover:text-white">@qlf_gaming0</a>
              </li>
            </ul>
          </div>

          {/* Levels */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">{t("footer.features")}</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>🎱 Upper Level — Billiards Lounge</li>
              <li>🎮 Lower Level — Gaming Salle</li>
              <li>🎱 2 Billiards Tables</li>
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
