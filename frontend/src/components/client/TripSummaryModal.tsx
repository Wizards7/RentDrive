"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/src/hooks/redux";
import { selectToken } from "@/src/store/slices/authSlice";
import {
  selectShowSummary, selectReceipt, selectUserRating,
  closeSummary, setUserRating,
} from "@/src/store/slices/rentalSlice";

const PKG_LABEL: Record<string, string> = {
  PER_MINUTE: "Flex / Per Minute", H3: "3 Hours", H6: "6 Hours", H12: "12 Hours", H24: "24 Hours",
};

const TIER_COLOR: Record<string, string> = {
  Standard: "text-gray-400",
  Silver:   "text-slate-300",
  Gold:     "text-amber-400",
  Platinum: "text-cyan-300",
  VIP:      "text-purple-400",
};

function fmt(n: number) { return n.toFixed(2); }
function fmtMins(m: number) {
  const h = Math.floor(m / 60), min = m % 60;
  return h > 0 ? `${h}h ${min.toString().padStart(2, "0")}m` : `${m}m`;
}

export function TripSummaryModal() {
  const dispatch   = useAppDispatch();
  const token      = useAppSelector(selectToken);
  const show       = useAppSelector(selectShowSummary);
  const receipt    = useAppSelector(selectReceipt);
  const userRating = useAppSelector(selectUserRating);

  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const handleRate = useCallback((star: number) => {
    dispatch(setUserRating(star));
  }, [dispatch]);

  const handleClose = useCallback(async () => {
    if (!submitted && userRating > 0 && receipt && token) {
      setSubmitting(true);
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rentals/${receipt.orderId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ rating: userRating }),
        });
        setSubmitted(true);
      } catch { /* non-critical */ }
      setSubmitting(false);
    }
    dispatch(closeSummary());
    setSubmitted(false);
  }, [dispatch, receipt, token, userRating, submitted]);

  if (!show || !receipt) return null;

  const { breakdown: b } = receipt;
  const hasDiscount = b.discountPct > 0;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* ── Green header ── */}
        <div className="bg-gradient-to-br from-primary to-green-700 px-6 pt-8 pb-6 text-center relative">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white">Trip Complete!</h2>
          <p className="text-white/70 text-sm mt-1">Thanks for riding with RentDrive</p>

          {/* Car image */}
          {receipt.carImage && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-16 rounded-xl overflow-hidden opacity-80">
              <Image src={receipt.carImage} alt={receipt.carName} fill className="object-cover" unoptimized />
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-4">

          {/* Car info */}
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1V5h4l3 5v5h-1m-1 1H9" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm">{receipt.carName}</p>
              <p className="text-white/50 text-xs">{receipt.licensePlate} · {receipt.carClass} · {PKG_LABEL[receipt.package] ?? receipt.package}</p>
            </div>
          </div>

          {/* Trip metrics */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Duration",  value: fmtMins(receipt.durationMins) },
              { label: "Distance",  value: `${receipt.distanceKm.toFixed(1)} km` },
              { label: "Zone",      value: receipt.zone },
            ].map((m) => (
              <div key={m.label} className="bg-white/5 rounded-2xl p-3 text-center">
                <p className="text-white/40 text-[10px] uppercase font-bold mb-1">{m.label}</p>
                <p className="text-white font-black text-sm leading-none">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Receipt breakdown */}
          <div className="bg-white/5 rounded-2xl px-4 py-3 space-y-2">
            <p className="text-white/40 text-xs uppercase font-black mb-3 tracking-wider">Receipt</p>

            {[
              { label: "Base price",         value: fmt(b.base),        muted: false },
              b.overageMins > 0
                ? { label: `Overage (${b.overageMins} min)`, value: `+${fmt(b.penaltyCost)}`, muted: false }
                : null,
              b.overageKm > 0
                ? { label: `Extra km (${b.overageKm.toFixed(1)} km)`, value: `+${fmt(b.overageKm * 1)}`, muted: false }
                : null,
              { label: "Subtotal",           value: fmt(b.subtotal),    muted: true },
            ].filter(Boolean).map((row) => row && (
              <div key={row.label} className={`flex justify-between items-center ${row.muted ? "opacity-60" : ""}`}>
                <span className="text-white/70 text-sm">{row.label}</span>
                <span className="text-white font-bold text-sm">{row.value} TJS</span>
              </div>
            ))}

            {hasDiscount && (
              <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-1">
                <span className={`text-sm font-bold ${TIER_COLOR[b.discountTier] ?? "text-amber-400"}`}>
                  {b.discountTier} discount (−{b.discountPct}%)
                </span>
                <span className={`font-bold text-sm ${TIER_COLOR[b.discountTier] ?? "text-amber-400"}`}>
                  −{fmt(b.discountAmt)} TJS
                </span>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-1">
              <span className="text-white font-black text-base">Total</span>
              <span className="text-primary font-black text-xl">{fmt(b.finalTotal)} TJS</span>
            </div>
          </div>

          {/* Payment */}
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-2xl">
            <span className="text-white/50 text-xs">Payment</span>
            <span className="text-white text-xs font-bold">{receipt.paymentMethod}</span>
          </div>

          {/* Rating */}
          <div className="bg-white/5 rounded-2xl px-4 py-4 text-center">
            <p className="text-white font-bold text-sm mb-3">How was your trip?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className={`text-3xl transition-transform active:scale-90 ${
                    star <= userRating ? "text-amber-400" : "text-white/20"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            {userRating > 0 && (
              <p className="text-white/50 text-xs mt-2">
                {["", "Poor", "Fair", "Good", "Great", "Excellent!"][userRating]}
              </p>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-6 pt-2">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="w-full bg-primary hover:bg-green-600 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-lg shadow-primary/30 active:scale-[0.98] disabled:opacity-70"
          >
            {submitting ? "Saving…" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
