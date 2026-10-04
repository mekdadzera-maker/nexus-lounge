import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import AttachmentContent from "@/components/lounge/AttachmentContent";
import { useLang } from "@/lib/i18n";

export default function SupportHub() {
  const { t } = useLang();
  const [rooms, setRooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [bookings, setBookings] = useState([]);
  const scrollRef = useRef(null);

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

  const scrollBottom = () => setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 60);

  const send = async () => {
    if (!text.trim() || !selected) return;
    const content = text.trim();
    setText("");
    await supabase.from("support_messages").insert({ chat_room_id: selected.id, sender_role: "Staff", message_text: content });
    await supabase.from("chat_rooms").update({ last_message_at: new Date().toISOString(), last_message_preview: content.slice(0, 80) }).eq("id", selected.id);
    scrollBottom();
  };

  return (
    <div className="grid h-[70vh] grid-cols-1 gap-4 md:grid-cols-[260px_1fr_240px]">
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
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={t("admin.replyPh")} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500" />
            <button onClick={send} className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-400"><Send className="h-4 w-4" /></button>
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
