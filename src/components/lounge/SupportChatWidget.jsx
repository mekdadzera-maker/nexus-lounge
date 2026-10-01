import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, Mic, Square, Paperclip } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import AttachmentContent from "@/components/lounge/AttachmentContent";

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

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

  useEffect(() => () => stopRecording(), []);

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

  const uploadAndSend = async (file, kind) => {
    if (!file || !roomId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || (kind === "audio" ? "webm" : "bin");
      const path = `${roomId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-attachments").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("chat-attachments").getPublicUrl(path);
      const caption = kind === "audio" ? "🎤 Voice message" : `📎 ${file.name}`;
      await supabase.from("support_messages").insert({
        chat_room_id: roomId,
        sender_role: "Customer",
        message_text: caption,
        message_type: kind,
        file_url: pub.publicUrl,
        file_name: file.name,
        file_mime: file.type,
      });
      await supabase.from("chat_rooms").update({ last_message_at: new Date().toISOString(), last_message_preview: caption.slice(0, 80), is_unread_by_admin: true }).eq("id", roomId);
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
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="flex h-[460px] w-[340px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101012] shadow-2xl">
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
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${m.sender_role === "Customer" ? "rounded-br-sm bg-blue-500 text-white" : "rounded-bl-sm bg-white/10 text-white"}`}>
                      <AttachmentContent message={m} url={m.file_url} />
                    </div>
                  </div>
                ))}
              </div>

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
                    <button onClick={stopRecording} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-400" aria-label="Stop recording">
                      <Square className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      placeholder="Type a message..."
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
            </>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-2xl transition hover:bg-blue-400 hover:scale-105">
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
