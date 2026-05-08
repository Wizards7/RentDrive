"use client";

import { motion } from "framer-motion";
import { Link, useRouter } from "@/src/i18n/navigation";
import { useAppDispatch } from "@/src/hooks/redux";
import { logout } from "@/src/store/slices/authSlice";
import { useGetMeQuery } from "@/src/store/apis/userApi";
import type { MeUser } from "@/src/store/apis/userApi";
import { Navbar } from "@/src/components/landing/Navbar";

/* ── Tier config ── */
const TIERS = [
  { name: "Standard", min: 0,  max: 4,  pct: 0,  accent: "#9ca3af", grad: "from-zinc-800 to-zinc-900" },
  { name: "Silver",   min: 5,  max: 9,  pct: 5,  accent: "#cbd5e1", grad: "from-slate-600 to-slate-900" },
  { name: "Gold",     min: 10, max: 19, pct: 10, accent: "#fbbf24", grad: "from-amber-700 to-zinc-900" },
  { name: "Platinum", min: 20, max: Infinity, pct: 15, accent: "#67e8f9", grad: "from-cyan-800 to-zinc-900" },
];
const VIP_TIER = { name: "VIP", min: 0, max: Infinity, pct: 0, accent: "#c084fc", grad: "from-purple-800 to-zinc-900" };

function getTierConfig(user: MeUser) {
  if (user.discountTier === "VIP") return { ...VIP_TIER, pct: user.vipDiscount ?? 0 };
  return TIERS.find((t) => t.name === user.discountTier) ?? TIERS[0];
}

function getNextTier(completedRentals: number, isVip: boolean) {
  if (isVip) return null;
  return TIERS.find((t) => t.min > completedRentals) ?? null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function VerifyBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
      Verified
    </span>
  ) : (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 text-white/30 border border-white/8">
      Pending
    </span>
  );
}

const CARD = "rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-sm";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { data, isLoading } = useGetMeQuery();
  const user = data?.user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-primary animate-spin" />
          <p className="text-white/30 text-xs tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tier        = getTierConfig(user);
  const nextTier    = getNextTier(user.completedRentals, user.isVip);
  const progressPct = nextTier
    ? Math.min(100, Math.round((user.completedRentals / nextTier.min) * 100))
    : 100;
  const ridesLeft   = nextTier ? nextTier.min - user.completedRentals : 0;
  const initials    = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen text-white pt-16">
      <Navbar />

      {/* ── Top bar ── */}
      <div className="border-b border-white/8 bg-black/30 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-primary transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="w-px h-4 bg-white/10" />
          <h1 className="text-sm font-black text-white">My Profile</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-xl mx-auto px-4 pt-6 pb-20 flex flex-col gap-4"
      >

        {/* ── User Header ── */}
        <div className={`${CARD} p-5 flex items-center gap-4`}>
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-xl font-black"
            style={{
              background: `linear-gradient(135deg, ${tier.accent}30, ${tier.accent}10)`,
              border: `1.5px solid ${tier.accent}40`,
              color: tier.accent,
            }}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-white truncate leading-tight">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">{user.phone}</p>
            <p className="text-xs text-zinc-600 mt-0.5">Member since {fmtDate(user.createdAt)}</p>
          </div>

          {/* Rating pill */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5">
              <span className="text-sm">⭐</span>
              <span className="text-sm font-black text-amber-400">{user.rating.toFixed(1)}</span>
            </div>
            <span className="text-[9px] text-zinc-600 uppercase tracking-wide">Rating</span>
          </div>
        </div>

        {/* ── Loyalty / Discount Banner ── */}
        <div
          className={`rounded-2xl border border-white/8 p-5 relative overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, ${tier.accent}18 0%, rgba(10,10,10,0.9) 70%)`,
            borderColor: `${tier.accent}25`,
          }}
        >
          {/* Glow */}
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: tier.accent }}
          />

          <div className="relative flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Loyalty Status</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: tier.accent, boxShadow: `0 0 8px ${tier.accent}` }}
                />
                <span className="text-xl font-black" style={{ color: tier.accent }}>{tier.name}</span>
              </div>
              {nextTier && (
                <p className="text-xs text-white/30 mt-1">
                  {ridesLeft} more ride{ridesLeft !== 1 ? "s" : ""} to reach {nextTier.name}
                </p>
              )}
              {!nextTier && (
                <p className="text-xs mt-1" style={{ color: tier.accent }}>Maximum tier reached 🏆</p>
              )}
            </div>

            {user.discountPct > 0 ? (
              <div className="text-right">
                <p className="text-4xl font-black leading-none" style={{ color: tier.accent }}>
                  {user.discountPct}%
                </p>
                <p className="text-[10px] text-white/30 uppercase tracking-wide mt-1">off every ride</p>
              </div>
            ) : (
              <div
                className="text-xs font-bold px-3 py-1.5 rounded-xl border"
                style={{ color: tier.accent, borderColor: `${tier.accent}30`, background: `${tier.accent}10` }}
              >
                No discount yet
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-[3px] w-full rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: tier.accent }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-white/30">{user.completedRentals} rides</span>
            <span className="text-[10px] text-white/30">
              {nextTier ? `${nextTier.min} for ${nextTier.name}` : "Max tier"}
            </span>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Completed", value: user.completedRentals, icon: "✓" },
            { label: "Rating",    value: user.rating.toFixed(1), icon: "⭐" },
            { label: "Total",     value: user.totalRentals,      icon: "∑" },
          ].map((s) => (
            <div key={s.label} className={`${CARD} p-4 text-center`}>
              <p className="text-xl font-black text-white leading-none">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Wallet */}
          <div className={`${CARD} p-4 flex flex-col gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-white">Wallet</p>
              <p className="text-xs text-zinc-500 mt-0.5">•••• •••• •••• 4242</p>
            </div>
          </div>

          {/* Ride history */}
          <Link href="/client" className={`${CARD} p-4 flex flex-col gap-3 hover:bg-white/[0.07] transition-colors`}>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-white">Ride History</p>
              <p className="text-xs text-zinc-500 mt-0.5">{user.totalRentals} trips total</p>
            </div>
          </Link>
        </div>

        {/* ── Account details ── */}
        <div className={`${CARD} overflow-hidden`}>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 px-5 pt-4 pb-2">Account</p>
          {[
            { label: "Phone", value: user.phone, verified: user.phoneVerified },
            { label: "Tajik Passport", value: user.tajikPassportNumber ?? "Not submitted", verified: user.tajikPassportVerified },
            { label: "Driver License", value: user.driverLicenseNumber ?? "Not submitted", verified: user.driverLicenseVerified },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-5 py-3.5 ${i < arr.length - 1 ? "border-b border-white/5" : ""}`}
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-0.5">{row.label}</p>
                <p className="text-sm font-bold text-white">{row.value}</p>
              </div>
              <VerifyBadge verified={row.verified} />
            </div>
          ))}
        </div>

        {/* ── Settings menu ── */}
        <div className={`${CARD} overflow-hidden divide-y divide-white/5`}>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 px-5 pt-4 pb-2">Settings</p>

          {[
            {
              label: "Saved Places",
              sub: "Home, Work & more",
              icon: (
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              bg: "bg-blue-500/10 border-blue-500/20",
            },
            {
              label: "Promo Codes",
              sub: "Enter a code for discounts",
              icon: (
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              ),
              bg: "bg-primary/10 border-primary/20",
            },
            {
              label: "Support & Help",
              sub: "Chat with our team",
              icon: (
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ),
              bg: "bg-violet-500/10 border-violet-500/20",
            },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left"
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.bg}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.sub}</p>
              </div>
              <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* ── Next tier roadmap ── */}
        {nextTier && (
          <div className={`${CARD} p-5`}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Next Milestones</p>
            <div className="space-y-3">
              {TIERS.filter((t) => t.min > user.completedRentals).map((t, i) => (
                <div key={t.name} className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-8 rounded-full shrink-0"
                    style={{ background: i === 0 ? t.accent : "rgba(255,255,255,0.06)" }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.min} rides · {t.pct}% off</p>
                  </div>
                  <span className="text-xs font-bold" style={{ color: i === 0 ? t.accent : "rgba(255,255,255,0.15)" }}>
                    {Math.max(0, t.min - user.completedRentals)} to go
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Log Out ── */}
        <button
          onClick={() => { dispatch(logout()); router.push("/"); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-bold hover:bg-red-500/10 hover:border-red-500/40 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>

      </motion.div>
    </div>
  );
}
