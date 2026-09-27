import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, User, LayoutDashboard, CalendarCheck, Phone, LogOut, LogIn, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const STAFF_ROLES = ["Admin", "admin", "Staff", "staff"];

export default function Navbar({ onReserve }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLang();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const pillRef = useRef(null);

  const isStaff = isAuthenticated && user?.role && STAFF_ROLES.includes(user.role);
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Account";

  const handleLogout = () => {
    setProfileOpen(false);
    setMobileOpen(false);
    logout();
  };

  const menuItems = (
    <>
      {isStaff && (
        <MenuItem icon={<LayoutDashboard className="h-4 w-4" />} label={t("nav.admin")} onClick={() => { navigate("/admin/dashboard"); setProfileOpen(false); setMobileOpen(false); }} />
      )}
      <MenuItem icon={<CalendarCheck className="h-4 w-4" />} label={t("nav.bookings")} onClick={() => { navigate("/my-bookings"); setProfileOpen(false); setMobileOpen(false); }} />
      <MenuItem icon={<Phone className="h-4 w-4" />} label={t("nav.contact")} href="tel:0554026108" onClick={() => { setProfileOpen(false); setMobileOpen(false); }} />
      {isAuthenticated ? (
        <MenuItem icon={<LogOut className="h-4 w-4" />} label={t("nav.logout")} onClick={handleLogout} danger />
      ) : (
        <MenuItem icon={<LogIn className="h-4 w-4" />} label={t("nav.login") + " / " + t("nav.signup")} onClick={() => { navigate("/login"); setProfileOpen(false); setMobileOpen(false); }} />
      )}
    </>
  );

  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-[#08080a]/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <svg viewBox="0 0 980 980" className="h-9 w-9" xmlns="http://www.w3.org/2000/svg">
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
        </Link>

        {/* Desktop right cluster */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <button
            onClick={onReserve}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            {t("nav.reserve")} <ChevronRight className="h-4 w-4" />
          </button>

          {/* Profile pill */}
          <div className="relative" ref={pillRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <User className="h-4 w-4 text-white/70" />
              <span className="max-w-[120px] truncate">{isAuthenticated ? displayName : "Account"}</span>
              <ChevronDown className={`h-4 w-4 text-white/50 transition ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#101012] p-1.5 shadow-2xl"
                  >
                    {menuItems}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-white md:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/5 bg-[#0c0c0e] md:hidden"
          >
            <div className="space-y-1 p-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => { onReserve(); setMobileOpen(false); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black"
                >
                  {t("nav.reserve")} <ChevronRight className="h-4 w-4" />
                </button>
                <LanguageSwitcher />
              </div>
              <div className="pt-1">{menuItems}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function MenuItem({ icon, label, onClick, href, danger }) {
  const cls = `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    danger ? "text-red-300 hover:bg-red-500/10" : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cls}>
        {icon} {label}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {icon} {label}
    </button>
  );
}
