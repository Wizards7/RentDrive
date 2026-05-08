"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/src/hooks/redux";
import { selectToken } from "@/src/store/slices/authSlice";
import {
  selectActiveRental, selectFinishing, selectFinishError,
  setActiveRental, setFinishing, setFinishError, openSummary,
  ActiveRental, TripReceipt,
} from "@/src/store/slices/rentalSlice";

/* ── helpers ── */
function fmtTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

function fmtCost(n: number) { return n.toFixed(2); }

const PKG_LABEL: Record<string, string> = {
  PER_MINUTE: "Flex", H3: "3H", H6: "6H", H12: "12H", H24: "24H",
};

interface Props {
  userLat: number | null;
  userLon: number | null;
}

function isInGreenZone(lat: number, lon: number) {
  return lat >= 38.530 && lat <= 38.592 && lon >= 68.745 && lon <= 68.808;
}

export function ActiveTripOverlay({ userLat, userLon }: Props) {
  const dispatch     = useAppDispatch();
  const token        = useAppSelector(selectToken);
  const rental       = useAppSelector(selectActiveRental);
  const finishing    = useAppSelector(selectFinishing);
  const finishError  = useAppSelector(selectFinishError);

  const tickRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt    = useRef<number>(Date.now());

  const [elapsed, setElapsed]     = useState(rental?.elapsedMins ?? 0);
  const [liveCost, setLiveCost]   = useState(rental?.liveCost ?? 0);
  const [remaining, setRemaining] = useState(rental?.remainingMins ?? null);
  const [isOver, setIsOver]       = useState(rental?.isOverLimit ?? false);
  const [extended, setExtended]   = useState(false);
  const [showZoneWarn, setShowZoneWarn] = useState(false);

  const perMin   = rental?.perMinRate ?? 1.5;
  const pkgLimit = rental?.pkgLimit   ?? null;

  /* ── local tick (every second for live display) ── */
  useEffect(() => {
    if (!rental) return;
    startedAt.current = Date.now() - rental.elapsedMins * 60_000;

    tickRef.current = setInterval(() => {
      const nowElapsed = Math.floor((Date.now() - startedAt.current) / 60_000);
      const nowRemaining = pkgLimit !== null ? Math.max(0, pkgLimit - nowElapsed) : null;
      const nowOver = pkgLimit !== null && nowElapsed > pkgLimit;

      let cost: number;
      if (rental.package === "PER_MINUTE") {
        cost = nowElapsed * perMin;
      } else if (nowOver && pkgLimit !== null) {
        const basePrice = rental.liveCost; // package price from server
        cost = basePrice + (nowElapsed - pkgLimit) * perMin;
      } else {
        cost = rental.liveCost;
      }

      setElapsed(nowElapsed);
      setRemaining(nowRemaining);
      setIsOver(nowOver);
      setLiveCost(+cost.toFixed(2));
    }, 10_000); // update every 10s

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [rental, perMin, pkgLimit]);

  /* ── poll server every 30s ── */
  useEffect(() => {
    if (!token) return;
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rentals/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (d.rental) {
          dispatch(setActiveRental(d.rental as ActiveRental));
          startedAt.current = Date.now() - d.rental.elapsedMins * 60_000;
        } else {
          dispatch(setActiveRental(null));
        }
      } catch { /* ignore */ }
    }, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, dispatch]);

  /* ── Finish trip ── */
  const handleFinish = useCallback(async () => {
    if (!rental) return;
    dispatch(setFinishError(null));

    if (userLat === null || userLon === null || !isInGreenZone(userLat, userLon)) {
      setShowZoneWarn(true);
      setTimeout(() => setShowZoneWarn(false), 5000);
      return;
    }

    dispatch(setFinishing(true));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rentals/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          rentalId:       rental.id,
          latitude:       userLat,
          longitude:      userLon,
          drivingMinutes: elapsed,
          waitingMinutes: 0,
          distanceKm:     +(elapsed * 0.3).toFixed(1), // estimate if no GPS odometer
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(setFinishError(data.error ?? "Could not finish trip"));
        return;
      }
      dispatch(openSummary(data.receipt as TripReceipt));
    } catch {
      dispatch(setFinishError("Network error. Please try again."));
    } finally {
      dispatch(setFinishing(false));
    }
  }, [rental, userLat, userLon, elapsed, token, dispatch]);

  /* ── Add 1 hour ── */
  const handleExtend = useCallback(async () => {
    setExtended(true);
    // In a real system, call /rentals/:id/extend. For now update local state only.
    if (pkgLimit !== null) {
      dispatch(setActiveRental({
        ...rental!,
        pkgLimit: pkgLimit + 60,
        remainingMins: (remaining ?? 0) + 60,
        isOverLimit: false,
      }));
    }
    setTimeout(() => setExtended(false), 2000);
  }, [rental, pkgLimit, remaining, dispatch]);

  if (!rental) return null;

  const inGreen = userLat !== null && userLon !== null && isInGreenZone(userLat, userLon);

  return (
    <>
      {/* ── Zone warning toast ── */}
      {showZoneWarn && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-full mx-4">
          <div className="bg-red-600 text-white rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3 animate-bounce">
            <span className="text-2xl shrink-0">🚫</span>
            <div>
              <p className="font-black text-sm">Can&apos;t finish here!</p>
              <p className="text-xs mt-0.5 opacity-90">
                Drive to the Green Zone (city centre) to end your trip safely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Expiry warning toast ── */}
      {remaining !== null && remaining <= 15 && remaining > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-full mx-4">
          <div className="bg-amber-500 text-white rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3">
            <span className="text-2xl shrink-0">⏰</span>
            <div>
              <p className="font-black text-sm">Ending in {remaining} min!</p>
              <p className="text-xs mt-0.5 opacity-90">Find a Green Zone to park or extend your time.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Expired overlay ── */}
      {isOver && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-full mx-4">
          <div className="bg-red-700 text-white rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3">
            <span className="text-2xl shrink-0">🚨</span>
            <div>
              <p className="font-black text-sm">Time is up!</p>
              <p className="text-xs mt-0.5 opacity-90">Penalty charges at {perMin} TJS/min now applying.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main floating card ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
        <div className={`rounded-3xl shadow-2xl overflow-hidden border ${
          isOver
            ? "border-red-500/40 bg-red-950/95"
            : "border-white/10 bg-zinc-900/95"
        } backdrop-blur-xl`}>

          {/* Progress bar for timed packages */}
          {pkgLimit !== null && (
            <div className="h-1 w-full bg-white/10">
              <div
                className={`h-full transition-all ${isOver ? "bg-red-500" : remaining! <= 15 ? "bg-amber-400" : "bg-primary"}`}
                style={{ width: `${Math.min(100, (elapsed / pkgLimit) * 100)}%` }}
              />
            </div>
          )}

          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isOver ? "bg-red-500" : "bg-primary"}`} />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {isOver ? "OVERAGE ACTIVE" : "TRIP IN PROGRESS"}
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isOver ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary"
              }`}>
                {PKG_LABEL[rental.package]}
              </span>
            </div>

            {/* Car */}
            <p className="text-white/60 text-xs font-medium mb-3">
              {rental.car.model} · {rental.car.licensePlate}
            </p>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Elapsed */}
              <div className="bg-white/5 rounded-2xl p-3 text-center">
                <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Time</p>
                <p className="text-white font-black text-lg leading-none">{fmtTime(elapsed)}</p>
              </div>

              {/* Remaining / Penalty indicator */}
              <div className={`rounded-2xl p-3 text-center ${
                pkgLimit === null
                  ? "bg-primary/10"
                  : isOver
                  ? "bg-red-500/20"
                  : remaining! <= 15
                  ? "bg-amber-500/20"
                  : "bg-white/5"
              }`}>
                <p className="text-white/40 text-[10px] font-bold uppercase mb-1">
                  {pkgLimit === null ? "Flex" : isOver ? "Over" : "Left"}
                </p>
                <p className={`font-black text-lg leading-none ${
                  pkgLimit === null ? "text-primary"
                  : isOver ? "text-red-400"
                  : remaining! <= 15 ? "text-amber-400"
                  : "text-white"
                }`}>
                  {pkgLimit === null
                    ? "∞"
                    : isOver
                    ? `+${fmtTime(elapsed - pkgLimit)}`
                    : fmtTime(remaining!)}
                </p>
              </div>

              {/* Live cost */}
              <div className="bg-white/5 rounded-2xl p-3 text-center">
                <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Cost</p>
                <p className="text-primary font-black text-lg leading-none">{fmtCost(liveCost)}</p>
                <p className="text-white/30 text-[9px]">TJS</p>
              </div>
            </div>

            {/* Error */}
            {finishError && (
              <div className="mb-3 bg-red-500/20 border border-red-500/30 rounded-xl px-3 py-2">
                <p className="text-red-400 text-xs font-medium">{finishError}</p>
              </div>
            )}

            {/* Zone indicator */}
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${
              inGreen ? "bg-primary/10" : "bg-amber-500/10"
            }`}>
              <div className={`w-2 h-2 rounded-full ${inGreen ? "bg-primary" : "bg-amber-400"}`} />
              <p className={`text-xs font-bold ${inGreen ? "text-primary" : "text-amber-400"}`}>
                {inGreen ? "✓ Green Zone — safe to finish" : "Drive to Green Zone to finish"}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {/* Extend (timed packages only) */}
              {pkgLimit !== null && (
                <button
                  onClick={handleExtend}
                  className="flex-none px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-2xl transition-colors"
                >
                  {extended ? "✓ +1h" : "+ 1h"}
                </button>
              )}

              {/* Finish */}
              <button
                onClick={handleFinish}
                disabled={finishing}
                className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${
                  inGreen
                    ? "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 active:scale-[0.98]"
                    : "bg-white/10 text-white/50 cursor-not-allowed"
                }`}
              >
                {finishing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Finishing…
                  </span>
                ) : "Finish Trip"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
