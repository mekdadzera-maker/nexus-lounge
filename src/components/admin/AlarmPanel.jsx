import React, { useState, useEffect, useRef } from "react";
import { Bell, Play, Upload, Save, Loader2, Check } from "lucide-react";
import { playAlarm } from "@/lib/alarm";
import { supabase } from "@/lib/supabaseClient";

const TRACKS = [
  { id: "chime", name: "Chime Alert" },
  { id: "siren", name: "Cyber Siren" },
  { id: "arcade", name: "Retro Arcade" },
];
const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500";

export default function AlarmPanel() {
  const [settings, setSettings] = useState(null);
  const [selected, setSelected] = useState("chime");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    supabase.from("venue_settings").select("*").limit(1).single().then(({ data }) => {
      setSettings(data);
      setSelected(data?.alarm_sound_url || "chime");
    });
  }, []);

  const preview = (url) => playAlarm(url);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("alarm-sounds").upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from("alarm-sounds").getPublicUrl(fileName);
        setSelected(data.publicUrl);
      }
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      await supabase.from("venue_settings").update({ alarm_sound_url: selected }).eq("id", settings.id);
      setSettings({ ...settings, alarm_sound_url: selected });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <p className="text-white/50">Loading…</p>;

  return (
    <div className="max-w-xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-white"><Bell className="h-5 w-5 text-blue-400" /> Alarm Sound</h2>

        <label className="mt-5 mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Select Alarm Sound Track</label>
        <div className="flex gap-2">
          <select value={selected.startsWith("http") ? "__custom__" : selected} onChange={(e) => { if (e.target.value !== "__custom__") setSelected(e.target.value); }} className={inputCls}>
            {TRACKS.map((tr) => <option key={tr.id} value={tr.id} className="bg-[#101012]">{tr.name}</option>)}
            {selected.startsWith("http") && <option value="__custom__" className="bg-[#101012]">Uploaded file</option>}
          </select>
          <button onClick={() => preview(selected)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10">
            <Play className="h-4 w-4" /> Preview
          </button>
        </div>

        <button onClick={() => fileRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10">
          <Upload className="h-4 w-4" /> {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload Custom MP3"}
        </button>
        <input ref={fileRef} type="file" accept="audio/mpeg,audio/wav,.mp3,.wav" onChange={onUpload} className="hidden" />
        {selected.startsWith("http") && <p className="mt-2 truncate text-xs text-emerald-400">Uploaded: {selected}</p>}

        <div className="mt-5">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#08080a] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          {saved && <span className="ml-3 inline-flex items-center gap-1 text-sm text-emerald-400"><Check className="h-4 w-4" /> Saved</span>}
        </div>
      </div>
    </div>
  );
}