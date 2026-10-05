import React, { useState, useEffect, useRef } from "react";
import { Pencil, Check, DoorOpen } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getCategory } from "@/lib/pricing";
import { useLang } from "@/lib/i18n";
import { localizedName } from "@/lib/stationI18n";

const toMin = (t) => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
const pad = (n) => String(n).padStart(2, "0");
const localDateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shiftDate = (s, days) => { const [y, m, d] = s.split("-").map(Number); return localDateStr(new Date(y, m - 1, d + days)); };
// true only while the session is running: start <= now < end (also handles sessions that cross midnight)
function isRunning(b, today, nowMin) {
  const start = toMin(b.start_time);
  if (start == null) return false;
  const base = b.booking_date === today ? 0 : -1440;
  let end = b.end_time ? toMin(b.end_time) : start + 30 * (b.quantity || 1);
  if (b.end_time && end <= start) end += 1440;
  return nowMin >= base + start && nowMin < base + end;
}
const VIP_IDS = ["PS5-08", "PS5-09"];
const ROOMS = [
  { key: "Upper", label: "Billiards", test: (s) => s.level === "Billiards", w: "9.9 m", h: "6.2 m", area: "56.9 m²", wall: "#2ecc71", height: "h-64" },
  { key: "Lower", label: "Gaming Floor", test: (s) => s.level === "Gaming" && !VIP_IDS.includes(s.id), w: "17.15 m", h: "12.4 m", area: "145.1 m²", wall: "#707070", height: "h-[440px]" },
  { key: "VIP", label: "VIP", test: (s) => s.level === "Gaming" && VIP_IDS.includes(s.id), w: "5.6 m", h: "4.2 m", area: "23.5 m²", wall: "#a855f7", height: "h-44 sm:h-52" },
];
const FURN = {
  billiards: { felt: "#357A3F", frame: "#5D4037", w: "w-16 sm:w-24", h: "h-9 sm:h-12", radius: "rounded-[4px]" },
  ps5: { felt: "#4A6D4A", frame: "#2f3f2f", w: "w-14 sm:w-24", h: "h-9 sm:h-12", radius: "rounded-lg" },
  xbox: { felt: "#365c36", frame: "#20321f", w: "w-12 sm:w-20", h: "h-9 sm:h-12", radius: "rounded-xl" },
};

function initPositions(stations) {
  const next = {};
  stations.forEach((s, i) => {
    if (s.pos_x != null && s.pos_y != null) next[s.id] = { x: Number(s.pos_x), y: Number(s.pos_y) };
    else { const col = i % 4; const row = Math.floor(i / 4) % 3; next[s.id] = { x: 10 + col * 22, y: 18 + row * 26 }; }
  });
  return next;
}

export default function RoomLayoutView({ stations, onEdit, onMoved }) {
  const { t, lang } = useLang();
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [edit, setEdit] = useState(false);
  const [positions, setPositions] = useState(() => initPositions(stations));
  const [savingId, setSavingId] = useState(null);
  const roomRefs = useRef({});

  useEffect(() => {
    const load = async () => {
    const today = localDateStr();
    const { data } = await supabase.from("bookings").select("*").in("booking_date", [shiftDate(today, -1), today]).neq("status", "Completed");
      setBookings(data || []);
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const nowMin = (() => { const d = new Date(now); return d.getHours() * 60 + d.getMinutes(); })();
  const todayStr = localDateStr();
  const activeBooking = (sid) => bookings.find((b) => b.station_id === sid && isRunning(b, todayStr, nowMin));
  
  useEffect(() => {
    setPositions((p) => {
      const next = { ...p };
      stations.forEach((s, i) => {
        if (next[s.id]) return;
        if (s.pos_x != null && s.pos_y != null) next[s.id] = { x: Number(s.pos_x), y: Number(s.pos_y) };
        else { const col = i % 4; const row = Math.floor(i / 4) % 3; next[s.id] = { x: 10 + col * 22, y: 18 + row * 26 }; }
      });
      return next;
    });
  }, [stations]);

  const startDrag = (e, s, roomKey) => {
    if (!edit) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const room = roomRefs.current[roomKey];
    if (!room) return;
    const rect = room.getBoundingClientRect();
    const move = (ev) => {
      ev.preventDefault();
      const x = Math.max(4, Math.min(96, ((ev.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(8, Math.min(92, ((ev.clientY - rect.top) / rect.height) * 100));
      setPositions((p) => ({ ...p, [s.id]: { x, y } }));
    };
    const up = async (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const x = Math.max(4, Math.min(96, ((ev.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(8, Math.min(92, ((ev.clientY - rect.top) / rect.height) * 100));
      setPositions((p) => ({ ...p, [s.id]: { x, y } }));
      setSavingId(s.id);
      await supabase.from("stations").update({ pos_x: Math.round(x), pos_y: Math.round(y) }).eq("id", s.id);
      setSavingId(null);
      onMoved?.();
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <div className="space-y-6" style={{ overscrollBehavior: "contain" }}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50">{edit ? t("adm.ly.drag") : t("adm.ly.liveStatus")}</p>
        <button onClick={() => setEdit((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${edit ? "bg-emerald-500 text-black hover:bg-emerald-400" : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}>
          {edit ? <><Check className="h-3.5 w-3.5" /> {t("adm.ly.done")}</> : <><Pencil className="h-3.5 w-3.5" /> {t("adm.ly.edit")}</>}
        </button>
      </div>

      <div
        className="rounded-2xl border border-white/10 p-5"
        style={{
          backgroundColor: "#ececec",
          backgroundImage: "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          touchAction: edit ? "none" : "auto",
          overscrollBehavior: "contain",
        }}
      >
        <div className="space-y-8">
          {ROOMS.map((room) => {
            const list = stations.filter(room.test);
            if (list.length === 0) return null;
            return (
              <div key={room.key} className="relative">
                <div ref={(el) => (roomRefs.current[room.key] = el)} className={`relative ${room.height} w-full overflow-visible rounded-md border-4`} style={{ borderColor: room.wall, backgroundColor: "#cbb499" }}>
                  <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(60,40,20,0.07) 0 2px, transparent 2px 16px)" }} />
                  <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider text-[#5d4037]/70">{t("adm.room." + room.key)} · {room.area}</span>
                  <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-t bg-[#cbb499] px-3 py-1 text-[10px] font-medium text-[#5d4037] border-x-2 border-t-2" style={{ borderColor: room.wall }}>
                    <DoorOpen className="h-3.5 w-3.5" /> {t("adm.ly.entrance")}
                  </div>
                  {list.map((s) => {
                    const pos = positions[s.id] || { x: 10, y: 18 };
                    const b = activeBooking(s.id);
                    const cat = getCategory(s);
                    const f = FURN[cat] || FURN.ps5;
                    const dot = s.status === "Maintenance" ? "bg-amber-400" : b ? "bg-blue-400" : "bg-emerald-300";
                    return (
                      <div key={s.id} onPointerDown={(e) => startDrag(e, s, room.key)} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 select-none touch-none ${edit ? "cursor-grab active:cursor-grabbing" : "cursor-default"} rounded-md`} title={localizedName(s, lang)}>
                        <div className={`relative ${f.w} ${f.h} ${f.radius} border-2 flex flex-col items-center justify-center text-center`} style={{ backgroundColor: f.felt, borderColor: f.frame }}>
                          {edit && onEdit && (
                            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onEdit(s); }} className="absolute -left-1.5 -top-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full border border-white/30 bg-[#101012] text-white/80 hover:bg-white hover:text-black">
                              <Pencil className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                            </button>
                          )}
                          <span className={`absolute right-1 top-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${dot}`} />
                          <span className="text-[8px] sm:text-[9px] font-bold leading-none text-white/90">{s.id}</span>
                          <span className="mt-0.5 text-[7px] sm:text-[8px] leading-none text-white/60">{s.status === "Maintenance" ? t("adm.ly.maint") : b ? (b.mode || t("adm.ly.inUse")) : t("adm.ly.free")}</span>
                          {savingId === s.id && <span className="absolute -right-1 -top-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-[10px] text-black/60">
          <Legend className="bg-[#357A3F]" label={t("adm.ly.billiard")} />
          <Legend className="bg-[#4A6D4A]" label={t("adm.ly.ps5")} />
          <Legend className="bg-[#365c36]" label={t("adm.ly.forza")} />
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {t("adm.ly.free")}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> {t("adm.ly.inSession")}</span>
        </div>
      </div>
    </div>
  );
}
function Legend({ className, label }) { return <span className="flex items-center gap-1"><span className={`h-3 w-4 rounded-sm border border-black/30 ${className}`} /> {label}</span>; }
