import React, { useState, useEffect, useRef } from "react";
import { Pencil, Check, DoorOpen } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getCategory } from "@/lib/pricing";

const toMin = (t) => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
const VIP_IDS = ["PS5-08", "PS5-09"];
const ROOMS = [
  { key: "Upper", label: "Billiards", test: (s) => s.level === "Billiards", w: "9.9 m", h: "6.2 m", area: "56.9 m²", wall: "#2ecc71", height: "h-64" },
  { key: "Lower", label: "Gaming Floor", test: (s) => s.level === "Gaming" && !VIP_IDS.includes(s.id), w: "17.15 m", h: "12.4 m", area: "145.1 m²", wall: "#707070", height: "h-[440px]" },
  { key: "VIP", label: "VIP", test: (s) => s.level === "Gaming" && VIP_IDS.includes(s.id), w: "5.6 m", h: "4.2 m", area: "23.5 m²", wall: "#a855f7", height: "h-44 sm:h-52" },
];
const FURN = {
  billiards: { felt: "#357A3F", frame: "#5D4037", w: "w-16 sm:w-24", h: "h-9 sm:h-12", radius: "rounded-[4px]" },
  ps5: { felt: "#4A6D4A", frame: "#2f3f2f", w: "w-14 sm:w-24", h: "h-9 sm:h-12", radius: "rounded-lg" },
  xbox: { felt: "#365c36", frame: "#20321f", w: "w-12 sm:w-20", h: "h-9 sm:h-12", radius: "rounded-xl" },
};

function initPositions(stations) {
  const next = {};
  stations.forEach((s, i) => {
    if (s.pos_x != null && s.pos_y != null) next[s.id] = { x: Number(s.pos_x), y: Number(s.pos_y) };
    else { const col = i % 4; const row = Math.floor(i / 4) % 3; next[s.id] = { x: 10 + col * 22, y: 18 + row * 26 }; }
  });
  return next;
}

export default function RoomLayoutView({ stations, onEdit, onMoved }) {
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [edit, setEdit] = useState(false);
  const [positions, setPositions] =
