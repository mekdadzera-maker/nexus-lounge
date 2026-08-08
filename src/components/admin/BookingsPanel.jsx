import React, { useState, useEffect } from "react";
import { Calendar, Clock, User, Phone, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function BookingsPanel() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*, stations(name)")
      .order("created_at", { ascending: false });
    if (!error) setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const markDone = async (id) => {
    setUpdatingId(id);
    await supabase.from("bookings").update({ status: "Completed" }).eq("id", id);
    await fetchBookings();
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/50">
        No bookings yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div
          key={b.id}
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-white">
                {b.stations?.name || b.station_id}
              </span>
              {b.status === "Completed" && (
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  Completed
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {b.full_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {b.contact_value}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {b.booking_date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {b.start_time}
              </span>
            </div>
            <div className="text-sm text-white/50">
              {b.mode} · Qty {b.quantity} · <span className="font-semibold text-white">{b.total_due} DA</span>
            </div>
          </div>

          {b.status !== "Completed" && (
            <button
              onClick={() => markDone(b.id)}
              disabled={updatingId === b.id}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              {updatingId === b.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Mark Completed
            </button>
          )}
        </div>
      ))}
    </div>
  );
}