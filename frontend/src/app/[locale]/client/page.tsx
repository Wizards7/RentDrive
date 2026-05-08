"use client";

import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/src/hooks/redux";
import { useGetMeQuery } from "@/src/store/apis/userApi";
import { useGetRentalHistoryQuery } from "@/src/store/apis/rentalApi";
import { selectTrip, selectSelectedTripId } from "@/src/store/slices/historySlice";
import { openSummary, TripReceipt } from "@/src/store/slices/rentalSlice";
import { TripSummaryModal } from "@/src/components/client/TripSummaryModal";
import type { HistoryRental, CarClass } from "@/src/types/interface";

/* ── constants ── */
const PKG_LABEL: Record<string, string> = {
  PER_MINUTE: "Flex", H3: "3H", H6: "6H", H12: "12H", H24: "24H",
};

const CLASS_COLOR: Record<CarClass, string> = {
  ECONOMY:   "bg-green-500/15 text-green-400",
  COMFORT:   "bg-blue-500/15 text-blue-400",
  CROSSOVER: "bg-amber-500/15 text-amber-400",
};

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10  text-red-400   border-red-500/20",
  ACTIVE:    "bg-primary/10  text-primary   border-primary/20",
};

/* ── helpers ── */
function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${time}`;
}

function fmtMins(m: number) {
  if (!m) return "—";
  const h = Math.floor(m / 60), min = m % 60;
  return h > 0 ? `${h}h ${min.toString().padStart(2, "0")}m` : `${m}m`;
}

function buildReceipt(r: HistoryRental): TripReceipt {
  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const total = r.totalCost ?? 0;
  return {
    orderId:      `ORD-${r.id.slice(-6).toUpperCase()}`,
    carName:      r.car.model,
    carClass:     r.car.carClass,
    carImage:     r.car.imageUrl,
    licensePlate: r.car.licensePlate,
    startTime:    fmt(r.startTime),
    endTime:      r.endTime ? fmt(r.endTime) : "—",
    durationMins: r.drivingMinutes,
    distanceKm:   r.distanceKm,
    zone:         "green",
    package:      r.package,
    breakdown: {
      base:         total,
      overageKm:    0,
      overageMins:  0,
      penaltyCost:  0,
      subtotal:     total,
      discountPct:  0,
      discountTier: "Standard",
      discountAmt:  0,
      finalTotal:   total,
    },
    currency:      "TJS",
    paymentMethod: "Card",
    userRating:    null,
  };
}

function computeStats(rentals: HistoryRental[], totalTrips: number) {
  const totalKm = rentals.reduce((s, r) => s + (r.distanceKm ?? 0), 0);
  const classCounts: Partial<Record<CarClass, number>> = {};
  for (const r of rentals) {
    classCounts[r.car.carClass] = (classCounts[r.car.carClass] ?? 0) + 1;
  }
  const favClass = (Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as CarClass | null;
  return { totalTrips, totalKm: +totalKm.toFixed(1), favClass };
}

/* ── Trip card ── */
function TripCard({
  rental,
  isSelected,
  onSelect,
  onViewReceipt,
}: {
  rental: HistoryRental;
  isSelected: boolean;
  onSelect: () => void;
  onViewReceipt: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border transition-all cursor-pointer overflow-hidden ${
        isSelected
          ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10"
          : "border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/8"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Car thumbnail */}
        <div className="w-[72px] h-[56px] rounded-xl bg-white/8 overflow-hidden relative shrink-0">
          {rental.car.imageUrl ? (
            <Image
              src={rental.car.imageUrl}
              alt={rental.car.model}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1V5h4l3 5v5h-1m-1 1H9" />
              </svg>
            </div>
          )}
        </div>

        {/* Middle info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-white truncate">{rental.car.model}</p>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${CLASS_COLOR[rental.car.carClass]}`}>
              {rental.car.carClass.slice(0, 3)}
            </span>
          </div>
          <p className="text-xs text-white/40 mb-1.5">{fmtDate(rental.startTime)}</p>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/50 font-medium">
              {fmtMins(rental.drivingMinutes)} · {rental.distanceKm ? `${rental.distanceKm} km` : "—"}
            </span>
            <span className="text-[10px] text-white/30">{PKG_LABEL[rental.package]}</span>
          </div>
        </div>

        {/* Right: cost + status */}
        <div className="text-right shrink-0">
          <p className="text-base font-black text-white leading-none mb-1.5">
            {rental.totalCost !== null ? Number(rental.totalCost).toFixed(2) : "—"}
            <span className="text-xs font-normal text-white/40 ml-0.5">TJS</span>
          </p>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${STATUS_STYLE[rental.status] ?? STATUS_STYLE.COMPLETED}`}>
            {rental.status}
          </span>
        </div>
      </div>

      {/* Expanded actions */}
      {isSelected && (
        <div
          className="border-t border-white/8 px-4 py-3 flex gap-2 bg-black/20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onViewReceipt}
            className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-colors"
          >
            View Receipt
          </button>
          <Link
            href={`/client/fleet?class=${rental.car.carClass}`}
            className="flex-1 py-2.5 bg-white/10 text-white/70 text-xs font-bold rounded-xl hover:bg-white/15 transition-colors text-center"
          >
            Drive Again →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Page ── */
export default function ClientHomePage() {
  const dispatch   = useAppDispatch();
  const selectedId = useAppSelector(selectSelectedTripId);

  const { data: meData,      isLoading: meLoading   } = useGetMeQuery();
  const { data: historyData, isLoading: histLoading } = useGetRentalHistoryQuery({ page: 1, limit: 50 });

  const rentals    = historyData?.rentals ?? [];
  const totalTrips = meData?.user.completedRentals ?? historyData?.total ?? 0;
  const stats      = computeStats(rentals, totalTrips);
  const user       = meData?.user;
  const loading    = meLoading || histLoading;

  const handleSelect      = (id: string) => dispatch(selectTrip(selectedId === id ? null : id));
  const handleViewReceipt = (r: HistoryRental) => dispatch(openSummary(buildReceipt(r)));

  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

        {/* ── Greeting ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/40 text-sm">Welcome back</p>
            {meLoading ? (
              <div className="h-7 w-36 bg-white/10 rounded-lg animate-pulse mt-1" />
            ) : (
              <h1 className="text-2xl font-black text-white">
                {user ? `${user.firstName} ${user.lastName}` : "My Trips"}
              </h1>
            )}
          </div>
          <Link
            href="/client/map"
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-primary/25 hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Find Car
          </Link>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Trips",      value: loading ? null : String(stats.totalTrips), icon: "🚗", sub: "rides completed"  },
            { label: "Total Distance",   value: loading ? null : `${stats.totalKm} km`,   icon: "📍", sub: "kilometres driven" },
            { label: "Favourite Class",  value: loading ? null : (stats.favClass ?? "—"),  icon: "⭐", sub: "most used class"  },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-2xl border border-white/8 p-4 text-center backdrop-blur-sm">
              <p className="text-xl mb-1">{s.icon}</p>
              {s.value === null ? (
                <div className="h-4 w-12 bg-white/10 rounded animate-pulse mx-auto mb-1" />
              ) : (
                <p className="text-sm font-black text-white leading-tight">{s.value}</p>
              )}
              <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Loyalty badge ── */}
        {user && user.discountPct > 0 && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3">
            <span className="text-xl shrink-0">🏆</span>
            <div>
              <p className="text-sm font-bold text-amber-300">
                {user.discountTier} member — {user.discountPct}% off every ride
              </p>
              <p className="text-xs text-amber-400/60 mt-0.5">Discount applied automatically at checkout</p>
            </div>
          </div>
        )}

        {/* ── History feed ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-white">Past Trips</h2>
            {rentals.length > 0 && (
              <span className="text-xs text-white/30 font-medium">{rentals.length} rides</span>
            )}
          </div>

          {histLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/8 animate-pulse" />
              ))}
            </div>
          ) : rentals.length === 0 ? (
            <div className="bg-white/5 rounded-3xl border border-white/8 px-6 py-12 text-center backdrop-blur-sm">
              <div className="text-5xl mb-4">🚗</div>
              <h3 className="text-lg font-black text-white mb-2">No rides yet, bro!</h3>
              <p className="text-sm text-white/40 leading-relaxed mb-6">
                The nearest car is only 5 minutes away.
                <br />Let&apos;s go!
              </p>
              <Link
                href="/client/map"
                className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl shadow-md shadow-primary/25 hover:bg-green-700 transition-colors text-sm"
              >
                Find Your First Car
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rentals.map((rental) => (
                <TripCard
                  key={rental.id}
                  rental={rental}
                  isSelected={selectedId === rental.id}
                  onSelect={() => handleSelect(rental.id)}
                  onViewReceipt={() => handleViewReceipt(rental)}
                />
              ))}
              {historyData && historyData.total > rentals.length && (
                <p className="text-center text-xs text-white/30 py-2">
                  Showing {rentals.length} of {historyData.total} trips
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Receipt modal — triggered by openSummary dispatch */}
      <TripSummaryModal />
    </div>
  );
}
