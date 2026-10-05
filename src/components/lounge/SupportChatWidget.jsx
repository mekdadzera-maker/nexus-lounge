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
  const loadRef = useRef(null);
  const sigRef = useRef("");

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
    if (!roomId || !open) return;
    let cancelled = false;
    const loadMessages = async () => {
      const { data } = await supabase.rpc("chat_get_messages", { p_room: roomId });
      if (cancelled || !data) return;
      const sig = data.length + ":" + (data[data.length - 1]?.id || "");
      if (sig !== sigRef.current) {
        sigRef.current = sig;
        setMessages(data);
        scrollBottom();
      }
    };
    loadRef.current = loadMessages;
    loadMessages();
    const id = setInterval(loadMessages, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [roomId, open]);

  useEffect(() => () => stopRecording(), []);

  const scrollBottom = () => setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 60);

  const startChat = async () => {
    if (!name.trim()) return;
    const { data, error } = await supabase.rpc("chat_start", { p_name: name.trim() });
    if (!error && data) {
      setRoomId(data);
      setStarted(true);
      localStorage.setItem("nexus_chat_room", JSON.stringify({ id: data, name: name.trim() }));
    }
  };

  const send = async () => {
    if (!text.trim() || !roomId) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.rpc("chat_send", { p_room: roomId, p_text: content });
    if (error) { setText(content); return; }
    loadRef.current?.();
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
      const { error: sendErr } = await supabase.rpc("chat_send", {
        p_room: roomId,
        p_text: caption,
        p_type: kind,
        p_file_url: pub.publicUrl,
        p_file_name: file.name,
        p_file_mime: file.type,
      });
      if (sendErr) throw sendErr;
      loadRef.current?.();
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
                  <div className="flex flex-1 items-center gap-2 rounded-xl
