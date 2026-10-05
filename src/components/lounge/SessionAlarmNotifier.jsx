import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AlarmClock, X, LayoutDashboard } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";
import { playAlarm } from "@/lib/alarm";

const STAFF_ROLES = ["Admin", "admin", "Staff", "staff"];
const DEFAULT_BLOCK_MIN = 30; // fallback only, for bookings made before end_time existed
const POLL_MS = 10000;

function toMin(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function storageKey(date) {
  return `nexus_alerted_${date}`;
}
function loadAlerted(date) {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey(date)) || "[]"));
  } catch {
    return new Set();
  }
}
function saveAlerted(date, set) {
  try {
    localStorage.setItem(storageKey(date), JSON.stringify([...set]));
  } catch {}
}

export default function SessionAlarmNotifier() {
  const { user } = useAuth();
  const { t } = useLang();
  const [ringing, setRinging] = useState([]); // [{id, stationName, fullName}]
  const soundRef = useRef("chime");

  const isStaff = user?.role && STAFF_ROLES.includes(user.role);

  useEffect(() => {
    if (!isStaff) return;

    let cancelled = false;

    const check = async () => {
      const date = todayStr();
      const [{ data: settings }, { data: bookings }] = await Promise.all([
        supabase.from("venue_settings").select("alarm_sound_url").limit(1).single(),
        supabase
          .from("bookings")
          .select("id, station_id, full_name, start_time, end_time, quantity, status, stations(name)")
          .eq("booking_date", date)
          .neq("status", "Completed"),
      ]);
      if (cancelled) return;
      soundRef.current = settings?.alarm_sound_url || "chime";

      const alerted = loadAlerted(date);
      const nowMin = (() => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
      })();

      const justEnded = [];
      for (const b of bookings || []) {
        const start = toMin(b.start_time);
        if (start == null) continue;
        const end = b.end_time ? toMin(b.end_time) : start + DEFAULT_BLOCK_MIN * (b.quantity || 1);
        if (nowMin >= end && !alerted.has(b.id)) {
          alerted.add(b.id);
          justEnded.push({ id: b.id, stationName: b.stations?.name || b.station_id, fullName: b.full_name });
        }
      }

      if (justEnded.length > 0) {
        saveAlerted(date, alerted);
        setRinging((prev) => [...prev, ...justEnded]);
        playAlarm(soundRef.current);
      }
    };

    check();
    const id = setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isStaff]);

  const dismiss = (id) => setRinging((prev) => prev.filter((r) => r.id !== id));

  if (!isStaff || ringing.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3">
      {ringing.map((r) => (
        <div key={r.id} className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-red-500/40 bg-[#1a0f10] p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
              <AlarmClock className="h-5 w-5 animate-pulse text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-bold text-white">{t("alarm.title")}</p>
              <p className="mt-0.5 text-xs text-white/60">{t("alarm.ended")}</p>
              <p className="mt-1.5 truncate text-sm font-semibold text-red-300">{r.stationName}</p>
              <p className="truncate text-xs text-white/40">{r.fullName}</p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/admin"
                  onClick={() => dismiss(r.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#08080a] hover:bg-white/90"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" /> {t("alarm.openDashboard")}
                </Link>
                <button
                  onClick={() => dismiss(r.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10"
                >
                  {t("alarm.dismiss")}
                </button>
              </div>
            </div>
            <button onClick={() => dismiss(r.id)} className="shrink-0 text-white/30 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
