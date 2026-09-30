import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, CalendarRange, Clock, Tag, Bell, MessageSquare, Monitor, ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";
import OperatingHoursPanel from "@/components/admin/OperatingHoursPanel";
import PricingPanel from "@/components/admin/PricingPanel";
import AlarmPanel from "@/components/admin/AlarmPanel";
import SchedulerPanel from "@/components/admin/SchedulerPanel";
import SupportHub from "@/components/admin/SupportHub";
import BookingsPanel from "@/components/admin/BookingsPanel";
import StationsPanel from "@/components/admin/StationsPanel";

const STAFF_ROLES = ["Admin", "admin", "Staff", "staff"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState("bookings");
  const allowed = user?.role && STAFF_ROLES.includes(user.role);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080a] px-6">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-white">{t("admin.denied")}</h1>
          <p className="mt-2 text-white/50">{t("admin.deniedSub")}</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#08080a]">
            <ArrowLeft className="h-4 w-4" /> {t("admin.back")}
          </Link>
        </div>
      </div>
    );
  }
  const tabs = [
    { key: "bookings", label: "Bookings", icon: CalendarRange },
    { key: "stations", label: "Stations", icon: Monitor },
    { key: "scheduler", label: t("admin.tab.scheduler"), icon: CalendarRange },
    { key: "hours", label: t("admin.tab.hours"), icon: Clock },
    { key: "pricing", label: t("admin.tab.pricing"), icon: Tag },
    { key: "alarm", label: t("admin.tab.alarm"), icon: Bell },
    { key: "chat", label: t("admin.tab.chat"), icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#08080a]">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#08080a]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-400" />
            <h1 className="font-heading text-xl font-bold text-white">{t("admin.title")}</h1>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" /> {t("admin.back")}
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  tab === tb.key ? "bg-white text-[#08080a]" : "text-white/60 hover:bg-white/10"
                }`}
              >
                <tb.icon className="h-4 w-4" /> {tb.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {tab === "bookings" && <BookingsPanel />}
        {tab === "stations" && <StationsPanel />}
        {tab === "scheduler" && <SchedulerPanel />}
        {tab === "hours" && <OperatingHoursPanel />}
        {tab === "pricing" && <PricingPanel />}
        {tab === "alarm" && <AlarmPanel />}
        {tab === "chat" && <SupportHub />}
      </div>
    </div>
  );
}
