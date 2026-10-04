import React, { useState, useEffect } from "react";
import { Clock, Save, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 [color-scheme:dark]";

export default function OperatingHoursPanel() {
  const { t } = useLang();
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("venue_settings").select("*").limit(1).single().then(({ data }) => {
      setSettings(data);
      setForm(data ? { ...data } : null);
    });
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const { data, error } = await supabase
        .from("venue_settings")
        .update({
          opening_time: form.opening_time,
          closing_time: form.closing_time,
          display_closing_string: form.display_closing_string,
          current_rating: Number(form.current_rating) || 0,
        })
        .eq("id", settings.id)
        .select()
        .single();
      if (!error) {
        setSettings(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-white/50">{t("adm.loading")}</p>;

  return (
    <div className="max-w-xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-white">
          <Clock className="h-5 w-5 text-blue-400" /> {t("admin.tab.hours")}
        </h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">{t("admin.open")}</label>
            <input type="time" value={form.opening_time || ""} onChange={(e) => setForm({ ...form, opening_time: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">{t("admin.close")}</label>
            <input type="time" value={form.closing_time || ""} onChange={(e) => setForm({ ...form, closing_time: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">{t("admin.label")}</label>
            <input value={form.display_closing_string || ""} onChange={(e) => setForm({ ...form, display_closing_string: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">{t("admin.rating")}</label>
            <input type="number" step="0.1" min="0" max="5" value={form.current_rating ?? 0} onChange={(e) => setForm({ ...form, current_rating: e.target.value })} className={inputCls} />
          </div>
        </div>
        <button onClick={save} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#08080a] disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? t("admin.saving") : t("admin.update")}
        </button>
        {saved && <span className="ms-3 inline-flex items-center gap-1 text-sm text-emerald-400"><Check className="h-4 w-4" /> {t("admin.saved")}</span>}
      </div>
    </div>
  );
}
