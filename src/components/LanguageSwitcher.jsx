import React, { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useLang, LANGS } from "@/lib/i18n";

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white/80 transition hover:bg-white/10"
        aria-label="Language"
      >
        <Globe className="h-4 w-4" />
        {LANGS.find((l) => l.code === lang)?.label}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#101012] py-1 shadow-2xl">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-white/10 ${
                lang === l.code ? "text-white" : "text-white/60"
              }`}
            >
              <span>{l.label === "EN" ? "English" : l.label === "FR" ? "Français" : "العربية"}</span>
              {lang === l.code && <Check className="h-4 w-4 text-emerald-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}