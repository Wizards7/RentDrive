"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

/* ─── Types ─── */
interface Rental {
  id: string;
  package: string;
  startTime: string;
  endTime: string | null;
  totalCost: number | null;
  distanceKm: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  car: { id: string; model: string; carClass: string; imageUrl: string | null };
}

interface UserStats {
  totalRentals: number;
  completedRentals: number;
  totalSpend: number;
  preferredCategory: string | null;
  hasLoyaltyDiscount: boolean;
  loyaltyDiscountPct: number;
}

interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneVerified: boolean;
  tajikPassportVerified: boolean;
  driverLicenseVerified: boolean;
  isBlocked: boolean;
  isVip: boolean;
  vipDiscount: number;
  rating: number;
  isBlacklisted: boolean;
  createdAt: string;
  rentals: Rental[];
  stats: UserStats;
}

type IncidentReason = "Car damaged" | "Traffic violation" | "Dirty interior" | "Fuel not refuelled" | "Late return";

const INCIDENT_PENALTIES: { reason: IncidentReason; penalty: number }[] = [
  { reason: "Car damaged",        penalty: 2.0 },
  { reason: "Traffic violation",  penalty: 1.5 },
  { reason: "Dirty interior",     penalty: 1.0 },
  { reason: "Fuel not refuelled", penalty: 0.5 },
  { reason: "Late return",        penalty: 0.5 },
];

const CLASS_COLORS: Record<string, string> = {
  ECONOMY:   "bg-green-500/10 text-green-600",
  COMFORT:   "bg-blue-500/10 text-blue-600",
  CROSSOVER: "bg-amber-500/10 text-amber-600",
};

function getToken() {
  return (
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("admin_token="))
      ?.split("=")[1] ?? ""
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-5 h-5 ${rating >= s ? "text-amber-400" : rating >= s - 0.5 ? "text-amber-300" : "text-gray-200 dark:text-gray-700"}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser]         = useState<UserDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [actionLoad, setAction] = useState<string | null>(null);

  /* Incident modal state */
  const [incidentModal, setIncidentModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(INCIDENT_PENALTIES[0]);

  const fetchUser = useCallback(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  /* ─── Actions ─── */
  const handleBlock = async () => {
    setAction("block");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/block`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    fetchUser();
    setAction(null);
  };

  const handleBlacklist = async (blacklist: boolean) => {
    setAction("blacklist");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/blacklist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ blacklist }),
    });
    fetchUser();
    setAction(null);
  };

  const handleReportIncident = async () => {
    setAction("rate");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/rate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ penalty: selectedIncident.penalty, reason: selectedIncident.reason }),
    });
    setIncidentModal(false);
    fetchUser();
    setAction(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-400 text-sm">User not found.</p>
        <button onClick={() => router.back()} className="text-sm text-primary font-bold hover:underline">← Back to Users</button>
      </div>
    );
  }

  const ratingColor = user.rating >= 4 ? "text-green-600 dark:text-green-400" : user.rating >= 2 ? "text-amber-500" : "text-red-500";

  return (
    <div className="flex flex-col gap-6">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => router.push("/admin/users")} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          Users
        </button>
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</span>
      </div>

      {/* ── Profile header ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 ${user.isVip ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary"}`}>
            {user.firstName[0]}{user.lastName[0]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-gray-900 dark:text-white">{user.firstName} {user.lastName}</h1>
              {user.isVip && (
                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase">VIP {user.vipDiscount}%</span>
              )}
              {user.isBlacklisted && (
                <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded-full font-bold uppercase">Blacklisted</span>
              )}
              {user.isBlocked && (
                <span className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Blocked</span>
              )}
              {user.stats.hasLoyaltyDiscount && (
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase">
                  Loyalty {user.stats.loyaltyDiscountPct}% off
                </span>
              )}
            </div>
            <p className="text-sm font-mono text-gray-400">{user.phone}</p>
            <p className="text-xs text-gray-400 mt-0.5">Member since {new Date(user.createdAt).toLocaleDateString()}</p>

            {/* Doc badges */}
            <div className="flex gap-1.5 mt-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${user.tajikPassportVerified ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent"}`}>Passport</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${user.driverLicenseVerified ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent"}`}>License</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${user.phoneVerified ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent"}`}>Phone</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setIncidentModal(true)}
              disabled={!!actionLoad}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors border border-red-500/20"
            >
              Report Incident
            </button>
            <button
              onClick={() => handleBlacklist(!user.isBlacklisted)}
              disabled={actionLoad === "blacklist"}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${user.isBlacklisted ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : "bg-gray-900 text-white border-transparent hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"}`}
            >
              {actionLoad === "blacklist" ? "…" : user.isBlacklisted ? "Clear Blacklist" : "Blacklist"}
            </button>
            <button
              onClick={handleBlock}
              disabled={actionLoad === "block"}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${user.isBlocked ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"}`}
            >
              {actionLoad === "block" ? "…" : user.isBlocked ? "Unblock" : "Block"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Trust Rating + Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rating card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm col-span-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-3">Trust Rating</p>
          <div className="flex items-end gap-2 mb-2">
            <span className={`text-4xl font-black ${ratingColor}`}>{user.rating.toFixed(1)}</span>
            <span className="text-gray-300 dark:text-gray-600 text-sm mb-1">/5.0</span>
          </div>
          <StarRating rating={user.rating} />
          {user.rating < 1 && (
            <p className="text-[10px] text-red-500 font-bold mt-2">Auto-blacklisted — rating below 1.0</p>
          )}
          {user.rating >= 4.5 && (
            <p className="text-[10px] text-green-600 dark:text-green-400 font-bold mt-2">Excellent driver</p>
          )}
        </div>

        {/* Total rentals */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-3">Total Rentals</p>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{user.stats.totalRentals}</p>
          <p className="text-xs text-gray-400 mt-1">{user.stats.completedRentals} completed</p>
        </div>

        {/* Total spend */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-3">Total Spend</p>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{user.stats.totalSpend.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">TJS lifetime</p>
          {user.stats.hasLoyaltyDiscount && (
            <span className="inline-block mt-2 text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
              Loyalty {user.stats.loyaltyDiscountPct}% discount active
            </span>
          )}
        </div>

        {/* Preferred category */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-3">Preferred Category</p>
          {user.stats.preferredCategory ? (
            <>
              <span className={`inline-block text-sm font-black px-3 py-1.5 rounded-xl ${CLASS_COLORS[user.stats.preferredCategory] ?? "bg-gray-100 text-gray-600"}`}>
                {user.stats.preferredCategory}
              </span>
              <p className="text-xs text-gray-400 mt-2">Most rented class</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No rentals yet</p>
          )}
        </div>
      </div>

      {/* ── Rental History ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white">Rental History</h2>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-bold">
            {user.rentals.length} total
          </span>
        </div>

        {user.rentals.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No rentals yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-gray-800">
                  {["Car", "Package", "Start", "Duration", "Distance", "Cost", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {user.rentals.map((r, i) => {
                  const durationMin = r.endTime
                    ? Math.round((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000)
                    : null;
                  return (
                    <tr key={r.id} className={`${i < user.rentals.length - 1 ? "border-b border-gray-50 dark:border-gray-800/50" : ""} hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${CLASS_COLORS[r.car.carClass] ?? "bg-gray-100 text-gray-500"}`}>
                            {r.car.carClass.slice(0, 3)}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.car.model}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-500 dark:text-gray-400">{r.package}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{new Date(r.startTime).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {durationMin !== null ? `${durationMin} min` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{r.distanceKm?.toFixed(1)} km</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-gray-900 dark:text-white">
                        {r.totalCost !== null ? `${r.totalCost.toFixed(0)} TJS` : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === "COMPLETED" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                          r.status === "ACTIVE"    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                                     "bg-gray-100 dark:bg-gray-800 text-gray-400"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Report Incident Modal ── */}
      {incidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Report Incident</h2>
              <button onClick={() => setIncidentModal(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Current rating display */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Current Rating</p>
                  <p className={`text-2xl font-black mt-0.5 ${ratingColor}`}>{user.rating.toFixed(1)}</p>
                </div>
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">After Penalty</p>
                  <p className={`text-2xl font-black mt-0.5 ${Math.max(0, user.rating - selectedIncident.penalty) < 1 ? "text-red-500" : ratingColor}`}>
                    {Math.max(0, user.rating - selectedIncident.penalty).toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Incident options */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Incident Type</p>
                {INCIDENT_PENALTIES.map((inc) => (
                  <button
                    key={inc.reason}
                    onClick={() => setSelectedIncident(inc)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      selectedIncident.reason === inc.reason
                        ? "border-red-400 bg-red-500/5 text-red-600 dark:text-red-400"
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <span>{inc.reason}</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${selectedIncident.reason === inc.reason ? "bg-red-500/10 text-red-500" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                      -{inc.penalty.toFixed(1)} pts
                    </span>
                  </button>
                ))}
              </div>

              {Math.max(0, user.rating - selectedIncident.penalty) < 1 && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold">User will be automatically blacklisted (rating drops below 1.0)</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setIncidentModal(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleReportIncident}
                  disabled={actionLoad === "rate"}
                  className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-black transition-colors shadow-lg shadow-red-500/20 disabled:opacity-60"
                >
                  {actionLoad === "rate" ? "Reporting…" : "Confirm Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
