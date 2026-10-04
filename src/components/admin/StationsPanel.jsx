import React, { useState, useEffect } from "react";
import { Monitor, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { lbl } from "@/lib/adminI18n";
import { localizedName } from "@/lib/stationI18n";
import RoomLayoutView from "@/components/admin/RoomLayoutView";

const CATEGORIES = ["PS5", "Forza", "Billiards"];
const LEVELS = ["Gaming", "Billiards"];
const STATUSES = ["Available", "Occupied", "Maintenance"];

const emptyStation = { id: "", name: "", category: CATEGORIES[0], level: LEVELS[0], description: "", status: "Available" };

function statusColor(st) {
  if (st === "Available") return "bg-emerald-500/15 text-emerald-300";
  if (st === "Occupied") return "bg-blue-500/15 text-blue-300";
  return "bg-amber-500/15 text-amber-300";
}

export default function StationsPanel() {
  const { t, lang } = useLang();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("manage");

  const load = async (opts = {}) => {
    if (!opts.silent) setLoading(true);
    const { data } = await supabase.from("stations").select("*").order("id");
    setStations(data || []);
    if (!opts.silent) setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-white"><Monitor className="h-5 w-5 text-blue-400" /> {t("admin.tab.stations")}</h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button onClick={() => setView("manage")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${view === "manage" ? "bg-white text-[#08080a]" : "text-white/60 hover:text-white"}`}>{t("adm.st.manage")}</button>
            <button onClick={() => setView("live")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${view === "live" ? "bg-white text-[#08080a]" : "text-white/60 hover:text-white"}`}>{t("adm.st.live")}</button>
          </div>
          {view === "manage" && (
            <button onClick={() => setEditing({ ...emptyStation })} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
              <Plus className="h-4 w-4" /> {t("adm.add")}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-white/50" />
      ) : view === "live" ? (
        <RoomLayoutView stations={stations} onEdit={(s) => setEditing({ ...s })} onMoved={() => load({ silent: true })} />
      ) : stations.length === 0 ? (
        <p className="text-sm text-white/50">{t("adm.st.empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((s) => (
            <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/40">{s.id}</p>
                  <h3 className="truncate font-heading text-base font-bold text-white">{localizedName(s, lang)}</h3>
                  <p className="truncate text-xs text-white/50">{lbl(t, "adm.level.", s.level)} · {lbl(t, "adm.cat.", s.category)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(s.status)}`}>{lbl(t, "adm.status.", s.status)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-white/40">{s.description || "—"}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditing({ ...s })} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/70 hover:bg-white/10">
                  <Pencil className="h-3.5 w-3.5" /> {t("adm.edit")}
                </button>
                <button
                  onClick={async () => { if (window.confirm(t("adm.st.confirmDelete"))) { await supabase.from("stations").delete().eq("id", s.id); load(); } }}
                  className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <StationModal data={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function StationModal({ data, onClose, onSaved }) {
  const { t } = useLang();
  const [form, setForm] = useState(data);
  const [saving, setSaving] = useState(false);
  const isNew = !data.id;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const input = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none";

  const save = async () => {
    if (!form.id.trim() || !form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name, category: form.category, level: form.level, description: form.description, status: form.status };
      if (isNew) {
        await supabase.from("stations").insert({ id: form.id.trim(), ...payload });
      } else {
        await supabase.from("stations").update(payload).eq("id", form.id);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="scrollbar-thin max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#101012] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-white">{isNew ? t("adm.st.new") : t("adm.st.editTitle")}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t("adm.st.id")}><input value={form.id} disabled={!isNew} onChange={(e) => set("id", e.target.value)} placeholder={t("adm.st.idPh")} className={`${input} ${!isNew ? "opacity-50" : ""}`} /></FormField>
          <FormField label={t("admin.name")}><input value={form.name} onChange={(e) => set("name", e.target.value)} className={input} /></FormField>
          <FormField label={t("admin.category")}><Select value={form.category} opts={CATEGORIES} prefix="adm.cat." onChange={(v) => set("category", v)} input={input} /></FormField>
          <FormField label={t("adm.st.level")}><Select value={form.level} opts={LEVELS} prefix="adm.level." onChange={(v) => set("level", v)} input={input} /></FormField>
          <FormField label={t("adm.st.status")}><Select value={form.status} opts={STATUSES} prefix="adm.status." onChange={(v) => set("status", v)} input={input} /></FormField>
          <FormField label={t("adm.st.description")} className="col-span-2"><input value={form.description || ""} onChange={(e) => set("description", e.target.value)} className={input} /></FormField>
        </div>
        <button onClick={save} disabled={saving || !form.id.trim() || !form.name.trim()} className="mt-5 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-[#08080a] disabled:opacity-50">
          {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("admin.save")}
        </button>
      </div>
    </div>
  );
}

function FormField({ label, children, className }) {
  return <div className={className}><label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</label>{children}</div>;
}
function Select({ value, opts, onChange, input, prefix }) {
  const { t } = useLang();
  return <select value={value} onChange={(e) => onChange(e.target.value)} className={input}>{opts.map((o) => <option key={o} value={o} className="bg-[#101012]">{lbl(t, prefix, o)}</option>)}</select>;
}
