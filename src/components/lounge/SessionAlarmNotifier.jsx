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
const GRACE_MIN = 15; // only ring for sessions that ended within the last 15 min
const DAY = 1440;

function pad(n) { return String(n).padStart(2, "0"); }
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function shiftDate(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return localDateStr(new Date(y, m - 1, d + days));
}
function toMin(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
// Returns { ring, seen }. `ring` = sessions to alert now,
// `seen` = every session that has already ended (marked so it never rings later).
function findEnded(bookings, today, nowMin, alerted) {
  const ring = [];
  const seen = [];
  for (const b of bookings) {
    const start = toMin(b.start_time);
    if (start == null) continue;
    const base = b.booking_date === today ? 0 : -DAY; // minutes relative to today's midnight
    let end;
    if (b.end_time) {
      end = toMin(b.end_time);
      if (end <= start) end += DAY; // session crosses midnight (e.g. 23:30 -> 00:30)
    } else {
      end = start + DEFAULT_BLOCK_MIN * (b.quantity || 1);
    }
    end += base;
    if (nowMin >= end && !alerted.has(b.id)) {
      seen.push(b.id);
      if (nowMin - end <= GRACE_MIN) ring.push(b);
    }
  }
  return { ring, seen };
}

function storageKey(date) { return `nexus_alerted_${date}`; }
function loadAlerted(date) {
  try { return new Set(JSON.parse(localStorage.getItem(storageKey(date)) || "[]")); } catch { return new Set(); }
}
function saveAlerted(date, set) {
  try { localStorage.setItem(storageKey(date), JSON.stringify([...set])); } catch {}
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
      const today = localDateStr();
      const yesterday = shiftDate(today, -1);
      const [{ data: settings }, { data: bookings }] = await Promise.all([
        supabase.from("venue_settings").select("alarm_sound_url").limit(1).single(),
        supabase
          .from("bookings")
          .select("id, station_id, full_name, booking_date, start_time, end_time, quantity, status, stations(name)")
          .in("booking_date", [yesterday, today])
          .neq("status", "Completed"),
      ]);
      if (cancelled) return;
      soundRef.current = settings?.alarm_sound_url || "chime";

      const alerted = loadAlerted(today);
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();

      const { ring, seen } = findEnded(bookings || [], today, nowMin, alerted);
      if (seen.length === 0) return;

      seen.forEach((id) => alerted.add(id));
      saveAlerted(today, alerted);

      if (ring.length > 0) {
        setRinging((prev) => [
          ...prev,
          ...ring.map((b) => ({ id: b.id, stationName: b.stations?.name || b.station_id, fullName: b.full_name })),
        ]);
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
                  to="/admin/dashboard"
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
