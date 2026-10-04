import React, { useState, useEffect } from "react";
import { Tag, Plus, Trash2, Save, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

const CATS = ["PS5", "Forza", "Billiards"];
const inputCls = "w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500";

export default function PricingPanel() {
  const { t } = useLang();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    const { data } = await supabase.from("pricing_tiers").select("*").order("id");
    setTiers(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const grouped = CATS.map((c) => ({ category: c, rows: tiers.filter((r) => r.station_category === c) }));

  const saveRow = async (row) => {
    await supabase.from("pricing_tiers").update({
      label: row.label,
      price: Number(row.price) || 0,
    }).eq("id", row.id);
    await load();
  };

  const deleteRow = async (id) => {
    await supabase.from("pricing_tiers").delete().eq("id", id);
    setConfirmId(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-white"><Tag className="h-5 w-5 text-blue-400" /> {t("admin.tab.pricing")}</h2>
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#08080a]">
          <Plus className="h-4 w-4" /> {t("adm.add")}
        </button>
      </div>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-white/50" />
      ) : grouped.map((g) => (
        <div key={g.category} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">{t("adm.cat." + g.category)}</h3>
          <div className="space-y-2">
            {g.rows.map((r) => (
              <PricingRow key={r.id} tier={r} onSave={saveRow} onDelete={() => setConfirmId(r.id)} />
            ))}
            {g.rows.length === 0 && <p className="text-sm text-white/30">—</p>}
          </div>
        </div>
      ))}

      {adding && <AddModal onClose={() => setAdding(false)} onCreated={() => { setAdding(false); load(); }} />}
      {confirmId && (
        <ConfirmModal message={t("admin.confirmDelete")} onConfirm={() => deleteRow(confirmId)} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  );
}

function PricingRow({ tier, onSave, onDelete }) {
  const [row, setRow] = useState(tier);
  const [saving, setSaving] = useState(false);
  const dirty = row.label !== tier.label || String(row.price) !== String(tier.price);
  return (
    <div className="flex flex-col gap-2 sm:grid sm:grid-cols-12 sm:items-center">
      <input className={`${inputCls} sm:col-span-6`} value={row.label} onChange={(e) => setRow({ ...row, label: e.target.value })} />
      <div className="flex items-center gap-2 sm:col-span-6">
        <input className={`${inputCls} flex-1`} type="number" value={row.price} onChange={(e) => setRow({ ...row, price: e.target.value })} />
        <button onClick={() => { setSaving(true); onSave(row).finally(() => setSaving(false)); }} disabled={!dirty} className="shrink-0 rounded-lg p-2 text-emerald-400 hover:bg-white/10 disabled:opacity-30">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </button>
        <button onClick={onDelete} className="shrink-0 rounded-lg p-2 text-red-400 hover:bg-red-500/10">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AddModal({ onClose, onCreated }) {
  const { t } = useLang();
  const [form, setForm] = useState({ label: "", station_category: CATS[0], price: "" });
  const [saving, setSaving] = useState(false);
  const create = async () => {
    setSaving(true);
    await supabase.from("pricing_tiers").insert({
      label: form.label,
      station_category: form.station_category,
      price: Number(form.price) || 0,
    });
    setSaving(false);
    onCreated();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#101012] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-white">{t("adm.pr.addRate")}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input placeholder={t("adm.pr.namePh")} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={`${inputCls} px-3`} />
          <select value={form.station_category} onChange={(e) => setForm({ ...form, station_category: e.target.value })} className={`${inputCls} px-3`}>
            {CATS.map((c) => <option key={c} value={c} className="bg-[#101012]">{t("adm.cat." + c)}</option>)}
          </select>
          <input type="number" placeholder={t("adm.pr.pricePh")} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={`${inputCls} px-3`} />
        </div>
        <button onClick={create} disabled={saving || !form.label} className="mt-5 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-[#08080a] disabled:opacity-50">
          {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("admin.save")}
        </button>
      </div>
    </div>
  );
}

export function ConfirmModal({ message, onConfirm, onCancel }) {
  const { t } = useLang();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#101012] p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-white/80">{message}</p>
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10">{t("admin.cancel")}</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-400">{t("admin.delete")}</button>
        </div>
      </div>
    </div>
  );
}
