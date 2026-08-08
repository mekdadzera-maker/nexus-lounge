import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("nexus_chat_room");
    if (saved) {
      const parsed = JSON.parse(saved);
      setRoomId(parsed.id);
      setName(parsed.name);
      setStarted(true);
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("chat_room_id", roomId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      scrollBottom();
    };
    loadMessages();

    const channel = supabase
      .channel(`widget_messages_${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `chat_room_id=eq.${roomId}` }, (payload) => {
        setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
        scrollBottom();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [roomId]);

  const scrollBottom = () => setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 60);

  const startChat = async () => {
    if (!name.trim()) return;
    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({ customer_name: name.trim(), is_unread_by_admin: true })
      .select()
      .single();
    if (!error) {
      setRoomId(data.id);
      setStarted(true);
      localStorage.setItem("nexus_chat_room", JSON.stringify({ id: data.id, name: name.trim() }));
    }
  };

  const send = async () => {
    if (!text.trim() || !roomId) return;
    const content = text.trim();
    setText("");
    await supabase.from("support_messages").insert({ chat_room_id: roomId, sender_role: "Customer", message_text: content });
    await supabase.from("chat_rooms").update({ last_message_at: new Date().toISOString(), last_message_preview: content.slice(0, 80), is_unread_by_admin: true }).eq("id", roomId);
    scrollBottom();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="flex h-[420px] w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101012] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-bold text-white">Chat with us</p>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
          </div>

          {!started ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
              <p className="text-center text-sm text-white/50">Enter your name to start chatting with the counter staff.</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startChat()}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500"
              />
              <button onClick={startChat} disabled={!name.trim()} className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-[#08080a] disabled:opacity-50">
                Start Chat
              </button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-4">
                {messages.length === 0 && <p className="text-center text-xs text-white/30">Say hello to start the conversation.</p>}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_role === "Customer" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender_role === "Customer" ? "rounded-br-sm bg-blue-500 text-white" : "rounded-bl-sm bg-white/10 text-white"}`}>
                      {m.message_text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500"
                />
                <button onClick={send} className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-400">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-2xl transition hover:bg-blue-400 hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}