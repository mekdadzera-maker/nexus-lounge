import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, Mic, Square, Paperclip } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import AttachmentContent from "@/components/lounge/AttachmentContent";
import { useLang } from "@/lib/i18n";

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function SupportHub() {
  const { t } = useLang();
  const [rooms, setRooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [bookings, setBookings] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const loadRooms = async () => {
    const { data } = await supabase.from("chat_rooms").select("*").order("last_message_at", { ascending: false }).limit(50);
    setRooms(data || []);
  };

  useEffect(() => {
    loadRooms();
    const channel = supabase
      .channel("chat_rooms_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_rooms" }, loadRooms)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!selected) return;

    const loadThread = async () => {
      const { data: msgs } = await supabase
        .from("support_messages")
        .select("*")
        .eq("chat_room_id", selected.id)
        .order("created_at", { ascending: true });
      setMessages(msgs || []);

      await supabase.from("chat_rooms").update({ is_unread_by_admin: false }).eq("id", selected.id);

      const { data: bks } = await supabase
        .from("bookings")
        .select("*")
        .eq("full_name", selected.customer_name);
      setBookings(bks || []);
      scrollBottom();
    };
    loadThread();

    const channel = supabase
      .channel(`messages_${selected.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `chat_room_id=eq.${selected.id}` }, (payload) => {
        setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
        scrollBottom();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selected]);

  useEffect(() => () => stopRecording(), []);

  const scrollBottom = () => setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 60);

  const send = async () => {
    if (!text.trim() || !selected) return;
    const content = text.trim();
    setText("");
    await supabase.from("support_messages").insert({ chat_room_id: selected.id, sender_role: "Staff", message_text: content });
    await supabase.from("chat_rooms").update({ last_message_at: new Date().toISOString(), last_message_preview: content.slice(0, 80) }).eq("id", selected.id);
    scrollBottom();
  };

  const uploadAndSend = async (file, kind) => {
    if (!file || !selected) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || (kind === "audio" ? "webm" : "bin");
      const path = `${selected.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-attachments").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("chat-attachments").getPublicUrl(path);
      const caption = kind === "audio" ? "🎤 Voice message" : `📎 ${file.name}`;
      await supabase.from("support_messages").insert({
        chat_room_id: selected.id,
        sender_role: "Staff",
        message_text: caption,
        message_type: kind,
        file_url: pub.publicUrl,
        file_name: file.name,
        file_mime: file.type,
      });
      await supabase.from("chat_rooms").update({ last_message_at: new Date().toISOString(), last_message_preview: caption.slice(0, 80) }).eq("id", selected.id);
      scrollBottom();
    } catch {
      // upload failed silently; could add a toast here later
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (f) uploadAndSend(f, "file");
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const ext = (mr.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
        await uploadAndSend(file, "audio");
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  return (
    <div className="grid grid-cols-1 grid-rows-[160px_60vh_200px] gap-4 md:h-[70vh] md:grid-cols-[260px_1fr_240px] md:grid-rows-1">
      <div className="scrollbar-thin overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-2">
        {rooms.length === 0 && <p className="p-4 text-sm text-white/40">{t("admin.noRooms")}</p>}
        {rooms.map((r) => (
          <button key={r.id} onClick={() => setSelected(r)} className={`mb-1 flex w-full flex-col rounded-xl px-3 py-2.5 text-start transition ${selected?.id === r.id ? "bg-blue-500/15" : "hover:bg-white/10"}`}>
            <span className="flex items-center justify-between">
              <span className="truncate text-sm font-medium text-white">{r.customer_name}</span>
              {r.is_unread_by_admin && <span className="ms-2 h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-400" />}
            </span>
            <span className="truncate text-xs text-white/40">{r.last_message_preview || "—"}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="font-heading text-sm font-bold text-white">{selected?.customer_name || "—"}</p>
        </div>
        <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-4">
          {!selected && <p className="text-center text-sm text-white/40">{t("adm.sh.select")}</p>}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_role === "Staff" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender_role === "Staff" ? "rounded-ee-sm bg-emerald-500 text-black" : "rounded-es-sm bg-white/10 text-white"}`}>
                <AttachmentContent message={m} url={m.file_url} />
              </div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="flex items-center gap-2 border-t border-white/10 p-3">
            <input type="file" ref={fileInputRef} onChange={onPickFile} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || recording}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {recording ? (
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-200">REC {fmtTime(recSeconds)}</span>
                <button onClick={stopRecording} className="ms-auto flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-400" aria-label="Stop recording">
                  <Square className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={t("admin.replyPh")}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500"
                />
                <button onClick={startRecording} disabled={uploading} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40" aria-label="Record voice message">
                  <Mic className="h-5 w-5" />
                </button>
              </>
            )}

            {!recording && (
              <button onClick={send} disabled={uploading} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition hover:bg-blue-400 disabled:opacity-40">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="scrollbar-thin overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">{t("admin.context")}</h4>
        {!selected && <p className="text-sm text-white/30">—</p>}
        {selected && bookings.length === 0 && <p className="text-sm text-white/40">{t("admin.noBookings")}</p>}
        {bookings.map((b) => (
          <div key={b.id} className="mb-2 rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-sm font-medium text-white">{b.station_id}</p>
            <p className="text-xs text-white/50">{b.booking_date} · {b.start_time}</p>
            <p className="text-xs text-blue-300">{b.mode} × {b.quantity} — {b.total_due} DA</p>
          </div>
        ))}
      </div>
    </div>
  );
}
