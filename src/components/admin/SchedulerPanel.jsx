import React, { useState, useEffect } from "react";
import { CalendarRange, Plus, Loader2, X, Trash2 } from "lucide-react";
import { tiersForStation, computeEndTime } from "@/lib/pricing";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { localizedName } from "@/lib/stationI18n";

const START_HOUR = 10;
const END_HOUR = 27;
const PX_PER_HOUR = 90;
const DEFAULT_BLOCK_MIN = 30;

function toMin(t) { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); }
function fromMin(min) { const w = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(w / 60)).padStart(2, "0")}:${String(w % 60).padStart(2, "0")}`; }
function localToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function hourLabel(h) { const hh = ((h % 24) + 24) % 24; return `${String(hh).padStart(2, "0")}:00`; }

export default function SchedulerPanel() {
  const { t, lang } = useLang();
  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [date, setDate] = useState(localToday());
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((x) => x + 1), 30000); return () => clearInterval(id); }, []);
  const nowD = new Date();
  const nowMinutes = nowD.getHours() * 60 + nowD.getMinutes();
  const [loading, setLoading] = useState(true);
  const [walkin, setWalkin] = useState(null);
  const [clearBk, setClearBk] = useState(null);

  const load = async () => {
    setLoading(true);
    const [{ data: st }, { data: bk }, { data: tr }] = await Promise.all([
      supabase.from("stations").select("*"),
      supabase.from("bookings").select("*").eq("booking_date", date),
      supabase.from("pricing_tiers").select("*"),
    ]);
    setStations(st || []);
    setBookings(bk || []);
    setTiers(tr || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [date]);

  const totalMin = (END_HOUR - START_HOUR) * 60;
  const widthPx = totalMin * (PX_PER_HOUR / 60);

  const rowBookings = (sid) => bookings.filter((b) => b.station_id === sid);
  const stationName = (id) => { const st = stations.find((x) => x.id === id); return st ? localizedName(st, lang) : id; };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-white"><CalendarRange className="h-5 w-5 text-blue-400" /> {t("admin.tab.scheduler")}</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]" />
      </div>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-white/50" />
      ) : (
        <div dir="ltr" className="scrollbar-thin overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <div style={{ minWidth: widthPx + 144 }}>
            <div className="sticky top-0 z-10 flex bg-[#101012]">
              <div className="w-36 shrink-0 border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase text-white/40">{t("adm.sc.station")}</div>
              <div className="relative border-b border-white/10" style={{ width: widthPx }}>
                {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((h, i) => (
                  <div key={h} className="absolute top-0 border-l border-white/10 px-1.5 py-2 text-[10px] text-white/40" style={{ left: i * PX_PER_HOUR }}>{hourLabel(h)}</div>
                ))}
              </div>
            </div>

            {stations.map((s) => {
              const rowBks = rowBookings(s.id);
              return (
                <div key={s.id} className="flex border-b border-white/5">
                  <div className="flex w-36 shrink-0 flex-col justify-center gap-1 px-3 py-2">
                    <span className="truncate text-xs font-medium text-white">{localizedName(s, lang)}</span>
                    <button onClick={() => setWalkin({ station: s, time: fromMin(START_HOUR * 60) })} className="inline-flex items-center gap-1 self-start rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/25">
                      <Plus className="h-3 w-3" /> {t("adm.sc.walkin")}
                    </button>
                  </div>
                  <div className="relative h-14" style={{ width: widthPx }}>
                    {rowBks.map((b) => {
                      const start = toMin(b.start_time);
                      let end = b.end_time ? toMin(b.end_time) : start + DEFAULT_BLOCK_MIN * (b.quantity || 1);
                      if (b.end_time && end <= start) end += 1440;
                      const left = ((start - START_HOUR * 60) / 60) * PX_PER_HOUR;
                      const w = Math.max(20, ((end - start) / 60) * PX_PER_HOUR);
                      return (
                        <button key={b.id} onClick={() => setClearBk(b)} className="absolute top-2 flex h-10 flex-col justify-center overflow-hidden rounded-lg bg-blue-500/80 px-2 text-left text-[10px] text-white hover:bg-blue-400" style={{ left: Math.max(0, left), width: w }}>
                          <span className="truncate font-semibold">{b.full_name}</span>
                          <span className="truncate opacity-80">{b.start_time} · {b.mode}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {walkin && <WalkinModal data={walkin} tiers={tiersForStation(tiers, walkin.station)} date={date} onClose={() => setWalkin(null)} onCreated={() => { setWalkin(null); load(); }} />}
      {clearBk && (
        <ClearModal
          booking={clearBk}
          stationName={stationName(clearBk.station_id)}
          onClose={() => setClearBk(null)}
          onClear={async () => {
            await supabase.from("bookings").delete().eq("id", clearBk.id);
            await supabase.from("stations").update({ status: "Available" }).eq("id", clearBk.station_id);
            setClearBk(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function WalkinModal({ data, tiers, date, onClose, onCreated }) {
  const { t, lang } = useLang();
  const [name, setName] = useState("");
  const [time, setTime] = useState(data.time);
  const [tierId, setTierId] = useState(tiers[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const tier = tiers.find((x) => x.id === tierId);

  const create = async () => {
    if (!name.trim() || !tier) return;
    setSaving(true);
    await supabase.from("bookings").insert({
      station_id: data.station.id,
      full_name: name.trim(),
      contact_method: "Phone",
      contact_value: "",
      booking_date: date,
      start_time: time,
      end_time: computeEndTime(time, tier.duration_minutes, qty),
      mode: tier.label,
      quantity: qty,
      total_due: (tier.price || 0) * qty,
      status: "Pending",
    });
    await supabase.from("stations").update({ status: "Occupied" }).eq("id", data.station.id);
    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#101012] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-white">{t("adm.sc.walkinTitle", { name: localizedName(data.station, lang) })}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input placeholder={t("adm.sc.customerPh")} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" />
          <select value={tierId} onChange={(e) => setTierId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none">
            {tiers.map((tr) => <option key={tr.id} value={tr.id} className="bg-[#101012]">{tr.label} · {tr.price} DA</option>)}
          </select>
          <input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none" />
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm text-white/60">{t("conf.total")}</span>
            <span className="font-heading text-xl font-bold text-white">{(tier?.price || 0) * qty} DA</span>
          </div>
        </div>
        <button onClick={create} disabled={saving || !name.trim()} className="mt-5 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-[#08080a] disabled:opacity-50">
          {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("admin.confirm")}
        </button>
      </div>
    </div>
  );
}

function ClearModal({ booking, stationName, onClose, onClear }) {
  const { t } = useLang();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#101012] p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <Trash2 className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-3 text-base font-semibold text-white">{booking.full_name}</p>
        <p className="text-sm text-white/60">{stationName}</p>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-start">
          <p className="text-[10px] uppercase tracking-wider text-white/40">{t("adm.sc.startTime")}</p>
          <p className="text-sm font-semibold text-white">{booking.start_time}</p>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10">{t("admin.cancel")}</button>
          <button onClick={onClear} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-400">{t("adm.sc.clear")}</button>
        </div>
      </div>
    </div>
  );
                }
