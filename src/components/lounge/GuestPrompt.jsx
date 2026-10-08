import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, LogIn, UserX } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "@/lib/i18n";

export default function GuestPrompt({ station, onClose, onGuest }) {
  const { t } = useLang();
  const [canClose, setCanClose] = useState(false);
  const pressStartedOnBackdropRef = useRef(false);

  useEffect(() => {
    setCanClose(false);
    let raf1, raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setCanClose(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [station?.id]);

  const handleBackdropPointerDown = (e) => {
    pressStartedOnBackdropRef.current = e.target === e.currentTarget;
  };

  const handleBackdropPointerUp = (e) => {
    if (canClose && pressStartedOnBackdropRef.current && e.target === e.currentTarget) {
      onClose();
    }
    pressStartedOnBackdropRef.current = false;
  };

  if (!station) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        onPointerDown={handleBackdropPointerDown}
        onPointerUp={handleBackdropPointerUp}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#101012] p-7 text-center"
        >
          <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15">
            <UserX className="h-7 w-7 text-blue-400" />
          </div>
          <h3 className="mt-4 font-heading text-xl font-bold text-white">{t("guest.title", { name: station.name })}</h3>
          <p className="mt-2 text-sm text-white/55">
            {t("guest.sub")}
          </p>
          <div className="mt-6 space-y-2.5">
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-[#08080a] transition hover:bg-blue-400 hover:text-white"
            >
              <LogIn className="h-4 w-4" /> {t("guest.login")}
            </Link>
            <Link
              to="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <UserPlus className="h-4 w-4" /> {t("guest.signup")}
            </Link>
            <button
              onClick={onGuest}
              className="w-full py-2 text-sm font-medium text-white/50 transition hover:text-white"
            >
              {t("guest.continue")} →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
