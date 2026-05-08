"use client";

import { useEffect, useState } from "react";
import { Link } from "@/src/i18n/navigation";

function getAdminToken(): string {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("admin_token="))
      ?.split("=")[1] ?? ""
  );
}

/* ── Types ── */
interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface RecentCar {
  id: string;
  licensePlate: string;
  model: string;
  carClass: string;
  fuelLevel: number;
  status: string;
}

interface RecentTask {
  id: string;
  type: string;
  status: string;
  notes: string | null;
  createdAt: string;
  car: { licensePlate: string; model: string };
}

interface Stats {
  totalFleet: number;
  available: number;
  rented: number;
  maintenance: number;
  activeRentals: number;
  pendingTasks: number;
  dailyRevenue: number;
  recentCars: RecentCar[];
  recentTasks: RecentTask[];
}

/* ── Sub-components ── */
function FuelBar({ level }: { level: number }) {
  const color = level > 50 ? "bg-green-500" : level > 20 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${level}%` }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{level}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AVAILABLE:   "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    RENTED:      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    MAINTENANCE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] ?? styles.AVAILABLE}`}>
      {status}
    </span>
  );
}

const TASK_COLORS: Record<string, string> = {
  REFUEL:      "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  WASH:        "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  MAINTENANCE: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

const TASK_ICONS: Record<string, string> = { REFUEL: "⛽", WASH: "🚿", MAINTENANCE: "🔧" };

const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  COMPLETED:   "bg-green-500/10 text-green-600 dark:text-green-400",
};

/* ── Dashboard ── */
const NOTIF_ICONS: Record<string, string> = {
  RESERVATION:   "💳",
  TRIP_EXPIRING: "⏰",
  TRIP_EXPIRED:  "🚨",
  LOYALTY:       "🏆",
  ZONE_ALERT:    "📍",
};
const NOTIF_COLORS: Record<string, string> = {
  RESERVATION:   "border-green-500/30 bg-green-500/5",
  TRIP_EXPIRING: "border-amber-500/30 bg-amber-500/5",
  TRIP_EXPIRED:  "border-red-500/30 bg-red-500/5",
  LOYALTY:       "border-purple-500/30 bg-purple-500/5",
  ZONE_ALERT:    "border-blue-500/30 bg-blue-500/5",
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AdminDashboardPage() {
  const [stats, setStats]             = useState<Stats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [notifs, setNotifs]           = useState<Notification[]>([]);
  const [unread, setUnread]           = useState(0);
  const [markingRead, setMarkingRead] = useState(false);

  const loadStats = () => {
    setLoading(true);
    setFetchError(null);
    const adminToken = getAdminToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setFetchError(`API error ${r.status}: ${data?.error ?? r.statusText}`);
          return;
        }
        if (typeof data.totalFleet === "number") {
          setStats(data as Stats);
        } else {
          setFetchError(`Unexpected response: ${JSON.stringify(data).slice(0, 120)}`);
        }
      })
      .catch((e) => setFetchError(String(e)))
      .finally(() => setLoading(false));
  };

  const loadNotifs = () => {
    const adminToken = getAdminToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.notifications) {
          setNotifs(d.notifications as Notification[]);
          setUnread(d.unreadCount ?? 0);
        }
      })
      .catch(() => {});
  };

  const markAllRead = async () => {
    setMarkingRead(true);
    const adminToken = getAdminToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    }).catch(() => {});
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    setMarkingRead(false);
  };

  useEffect(() => {
    loadStats();
    loadNotifs();
    const poll = setInterval(loadNotifs, 30_000);
    return () => clearInterval(poll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statCards = [
    {
      label: "TOTAL FLEET",
      value: loading ? "—" : String(stats?.totalFleet ?? 0),
      sub: loading ? "" : `${stats?.available ?? 0} available · ${stats?.rented ?? 0} rented · ${stats?.maintenance ?? 0} in service`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1V5h4l3 5v5h-1m-1 1H9" />
        </svg>
      ),
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "ACTIVE RENTALS",
      value: loading ? "—" : String(stats?.activeRentals ?? 0),
      sub: "Currently on trip",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "text-green-500 dark:text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "PENDING TASKS",
      value: loading ? "—" : String(stats?.pendingTasks ?? 0),
      sub: "Needs attention",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
        </svg>
      ),
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "DAILY REVENUE",
      value: loading ? "—" : `${(stats?.dailyRevenue ?? 0).toFixed(0)} TJS`,
      sub: "Today so far",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Live fleet overview</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 hover:text-primary transition-colors font-medium px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── API error banner ── */}
      {fetchError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-4 py-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">Failed to load stats</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 font-mono">{fetchError}</p>
            <p className="text-xs text-red-400 mt-1">Make sure the backend is running and restart it if you just updated routes.</p>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{card.label}</p>
              <div className={`w-8 h-8 ${card.bg} rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
            {loading ? (
              <div className="h-9 w-16 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse mb-2" />
            ) : (
              <p className="text-3xl font-black text-gray-900 dark:text-white">{card.value}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Fleet + Tasks ── */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* Fleet table */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white">Fleet Inventory</h2>
            <Link href="/admin/cars" className="text-xs text-primary hover:underline font-bold">
              View All Assets →
            </Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-5 flex flex-col gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
                ))}
              </div>
            ) : !stats?.recentCars?.length ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No cars in fleet yet</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["License Plate", "Model", "Class", "Fuel", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentCars ?? []).map((car, i) => (
                    <tr
                      key={car.id}
                      className={`border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${
                        i === stats.recentCars.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 text-sm font-mono text-gray-600 dark:text-gray-400">{car.licensePlate}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-900 dark:text-white font-semibold">{car.model}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 capitalize">{car.carClass.charAt(0) + car.carClass.slice(1).toLowerCase()}</td>
                      <td className="px-5 py-3.5"><FuelBar level={car.fuelLevel} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={car.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Tasks panel */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white">Service Tasks</h2>
            <Link href="/admin/tasks" className="text-xs text-primary hover:underline font-bold">
              View All →
            </Link>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
              ))
            ) : !stats?.recentTasks?.length ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <span className="text-2xl">✅</span>
                <p className="text-sm text-gray-400 font-medium">No pending tasks</p>
              </div>
            ) : (
              (stats?.recentTasks ?? []).map((task) => (
                <div key={task.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TASK_COLORS[task.type] ?? TASK_COLORS.MAINTENANCE}`}>
                      {TASK_ICONS[task.type] ?? "🔧"} {task.type}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TASK_STATUS_COLORS[task.status] ?? ""}`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{task.car.model}</p>
                  <p className="text-[11px] font-mono text-gray-400 mb-1">{task.car.licensePlate}</p>
                  {task.notes && <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{task.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Live Notifications / Payments feed ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-900 dark:text-white">Live Activity</h2>
            {unread > 0 && (
              <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                {unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadNotifs}
              className="text-xs text-gray-400 hover:text-primary transition-colors font-medium px-2 py-1"
            >
              ↻ Refresh
            </button>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingRead}
                className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {notifs.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
            <span className="text-3xl">🔔</span>
            <p className="text-sm font-medium">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[420px] overflow-y-auto">
            {notifs.slice(0, 20).map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  !n.read ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                }`}
              >
                {/* Icon bubble */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border ${
                  NOTIF_COLORS[n.type] ?? "border-gray-200 bg-gray-50"
                }`}>
                  {NOTIF_ICONS[n.type] ?? "🔔"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-bold truncate ${!n.read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{n.body}</p>
                </div>

                {/* Time */}
                <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Users quick view ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-900 dark:text-white">User Management</h2>
            <span className="text-[10px] uppercase font-bold bg-green-500/10 text-green-600 px-2.5 py-1 rounded-full">Live</span>
          </div>
          <Link href="/admin/users" className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg font-bold hover:bg-primary/20 transition-colors">
            View All →
          </Link>
        </div>
        <div className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Manage drivers, trust ratings, blacklist controls and rental history from the Users section.
        </div>
      </div>
    </div>
  );
}
