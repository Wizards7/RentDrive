"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/src/i18n/navigation";
import { useAppSelector } from "@/src/hooks/redux";
import { selectIsAuthenticated, selectToken } from "@/src/store/slices/authSlice";

type CarClass = "ECONOMY" | "COMFORT" | "CROSSOVER";
type PkgKey   = "flex" | "3h" | "6h" | "24h";

interface Tariff {
  perMinDriving: number;
  package3h: number;
  package6h: number;
  package24h: number;
}

interface Car {
  id: string;
  model: string;
  year: number | null;
  carClass: CarClass;
  imageUrl: string | null;
  tariff: Tariff | null;
  latitude: number;
  longitude: number;
}

const PKG_LABEL: Record<PkgKey, string>   = { flex: "Flex (per min)", "3h": "3H Package", "6h": "6H Package", "24h": "24H Package" };
const PKG_BACKEND: Record<PkgKey, string> = { flex: "PER_MINUTE", "3h": "H3", "6h": "H6", "24h": "H24" };
const PKG_UNIT: Record<PkgKey, string>    = { flex: "TJS/min", "3h": "TJS", "6h": "TJS", "24h": "TJS" };

function getPkgPrice(tariff: Tariff, pkg: PkgKey): string {
  if (pkg === "flex") return tariff.perMinDriving.toFixed(2);
  if (pkg === "3h")   return String(tariff.package3h);
  if (pkg === "6h")   return String(tariff.package6h);
  return String(tariff.package24h);
}

const CARD_KEY = "saved_payment_card";

interface SavedCard { name: string; number: string; expiry: string; }

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
function maskNumber(n: string) {
  const d = n.replace(/\D/g, "");
  return d.length < 4 ? n : `•••• •••• •••• ${d.slice(-4)}`;
}

/* ─── Canvas confetti ─── */
const COLORS = ["#2D8A1E", "#4CAF50", "#FFD700", "#FF6B6B", "#60A5FA", "#F472B6", "#34D399"];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  angle: number; spin: number;
  color: string;
  w: number; h: number;
  alpha: number;
}

function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Particle[] = Array.from({ length: 160 }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * canvas.height * 0.4 - canvas.height * 0.2,
    vx:    (Math.random() - 0.5) * 6,
    vy:    Math.random() * 4 + 2,
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w:     Math.random() * 10 + 6,
    h:     Math.random() * 5 + 3,
    alpha: 1,
  }));

  let raf: number;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x     += p.vx;
      p.y     += p.vy;
      p.angle += p.spin;
      p.vy    += 0.12;
      if (p.y > canvas.height * 0.7) p.alpha -= 0.018;
      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }
    if (alive) raf = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}

const TIER_META: Record<string, { icon: string; color: string; bg: string }> = {
  Standard: { icon: "",   color: "text-gray-500",                        bg: "bg-gray-100 dark:bg-zinc-800" },
  Silver:   { icon: "🥈", color: "text-gray-500 dark:text-zinc-300",     bg: "bg-gray-100 dark:bg-zinc-700" },
  Gold:     { icon: "🥇", color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-500/10" },
  Platinum: { icon: "💎", color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-500/10" },
  VIP:      { icon: "⭐", color: "text-primary",                         bg: "bg-primary/10" },
};

type Step = "form" | "processing" | "success";

export default function PaymentPage() {
  const { carId }      = useParams<{ carId: string }>();
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const isAuth         = useAppSelector(selectIsAuthenticated);
  const token          = useAppSelector(selectToken);
  const pkg            = (searchParams.get("pkg") ?? "flex") as PkgKey;

  const [car, setCar]           = useState<Car | null>(null);
  const [loadingCar, setLoadingCar] = useState(true);
  const [step, setStep]         = useState<Step>("form");
  const [error, setError]       = useState<string | null>(null);
  const [rentalId, setRentalId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  /* Discount */
  const [discountPct, setDiscountPct]   = useState(0);
  const [discountTier, setDiscountTier] = useState("Standard");
  const [savedAmount, setSavedAmount]   = useState<number | null>(null);

  const [name, setName]         = useState("");
  const [number, setNumber]     = useState("");
  const [expiry, setExpiry]     = useState("");
  const [cvv, setCvv]           = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [usingSaved, setUsingSaved] = useState(false);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const countRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const confettiCleanup = useRef<(() => void) | undefined>(undefined);

  /* ── Redirect if not logged in ── */
  useEffect(() => {
    if (!isAuth) router.push(`/client/auth/login`);
  }, [isAuth, router]);

  /* ── Load saved card ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CARD_KEY);
      if (raw) {
        const sc = JSON.parse(raw) as SavedCard;
        setSavedCard(sc);
        setUsingSaved(true);
        setName(sc.name);
      }
    } catch { /* ignore */ }
  }, []);

  /* ── Fetch car + user discount in parallel ── */
  useEffect(() => {
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars/public`).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([carData, userData]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = carData.data ?? carData.cars ?? [];
        setCar(list.find((c: any) => c.id === carId) ?? null); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (userData?.user?.discountPct !== undefined) {
          setDiscountPct(userData.user.discountPct);
          setDiscountTier(userData.user.discountTier ?? "Standard");
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCar(false));
  }, [carId]);

  /* ── Confetti + countdown on success ── */
  useEffect(() => {
    if (step !== "success") return;

    if (canvasRef.current) {
      confettiCleanup.current = launchConfetti(canvasRef.current) ?? undefined;
    }

    setCountdown(5);
    countRef.current = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      if (countRef.current) clearInterval(countRef.current);
      confettiCleanup.current?.();
    };
  }, [step]);

  /* ── Trigger redirect when countdown hits 0 ── */
  useEffect(() => {
    if (step === "success" && countdown <= 0) {
      if (countRef.current) clearInterval(countRef.current);
      router.push("/client/map");
    }
  }, [countdown, step, router]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (saveCard && !usingSaved && name && number) {
      localStorage.setItem(CARD_KEY, JSON.stringify({
        name,
        number: number.replace(/\D/g, ""),
        expiry,
      } as SavedCard));
    }

    /* ── Step 1: fake payment processing (1.8 s) ── */
    setStep("processing");
    await new Promise((r) => setTimeout(r, 1800));

    /* ── Step 2: call reserve API (real — notifies admin, locks car) ── */
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars/${carId}/reserve`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          latitude:  car?.latitude  ?? 38.559772,
          longitude: car?.longitude ?? 68.773969,
          package:   PKG_BACKEND[pkg],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStep("form");
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setRentalId(data.rental?.id ?? null);
      if (data.discount?.savedAmount) setSavedAmount(data.discount.savedAmount);
      setStep("success");
    } catch {
      setStep("form");
      setError("Network error. Please try again.");
    }
  }, [saveCard, usingSaved, name, number, expiry, car, carId, token, pkg]);

  if (!isAuth) return null;

  const basePrice      = car?.tariff ? getPkgPrice(car.tariff, pkg) : "—";
  const isFlexPkg      = pkg === "flex";
  const discountedNum  = !isFlexPkg && basePrice !== "—" && discountPct > 0
    ? (parseFloat(basePrice) * (1 - discountPct / 100)).toFixed(2)
    : null;
  const price          = discountedNum ?? basePrice;
  const tierMeta       = TIER_META[discountTier] ?? TIER_META.Standard;

  /* ───────── PROCESSING ───────── */
  if (step === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 65% 40%, #1a3a6e 0%, #0f2147 40%, #070d1f 100%)" }}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-white">Processing payment…</p>
            <p className="text-sm text-zinc-400 mt-1">Please don&apos;t close this page</p>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ───────── SUCCESS ───────── */
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "radial-gradient(ellipse at 65% 40%, #1a3a6e 0%, #0f2147 40%, #070d1f 100%)" }}>
        <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />

        <div className="relative z-10 max-w-sm w-full flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "1.2s" }} />
            <div className="w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 relative">
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeDasharray="50" strokeDashoffset="0">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-white">Car Reserved! 🎉</h1>
            <p className="text-zinc-400 mt-2">
              <span className="font-bold text-white">{car?.model}</span> is locked for you. Walk to the car to start your trip.
            </p>
          </div>

          <div className="bg-white/5 border border-white/8 rounded-2xl px-6 py-4 w-full flex items-center justify-between backdrop-blur-sm">
            <div className="text-left">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Package</p>
              <p className="text-base font-black text-white">{PKG_LABEL[pkg]}</p>
              {discountPct > 0 && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {TIER_META[discountTier]?.icon ?? "🎁"} {discountPct}% {discountTier} discount applied
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-primary">{price}</p>
              <p className="text-xs text-zinc-500">{PKG_UNIT[pkg]}</p>
            </div>
          </div>

          {savedAmount !== null && savedAmount > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3 w-full flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div className="text-left">
                <p className="text-sm font-black text-primary">You saved {savedAmount.toFixed(2)} TJS!</p>
                <p className="text-xs text-zinc-500">{discountTier} member discount</p>
              </div>
            </div>
          )}

          {rentalId && (
            <div className="bg-white/5 border border-white/8 rounded-2xl px-5 py-3 w-full backdrop-blur-sm">
              <p className="text-xs text-zinc-500 font-medium">Rental ID</p>
              <p className="text-xs font-mono text-zinc-300 mt-0.5 break-all">{rentalId}</p>
            </div>
          )}

          <p className="text-sm text-zinc-400">
            Opening map in <span className="font-black text-primary text-base">{countdown}s</span>
          </p>

          <button
            onClick={() => router.push("/client/map")}
            className="w-full bg-primary hover:bg-primary-hover text-white font-black text-base py-4 rounded-2xl transition-colors shadow-lg shadow-primary/30"
          >
            Open Map Now
          </button>
        </div>
      </div>
    );
  }

  /* ───────── FORM ───────── */
  return (
    <div className="min-h-screen pb-10">

      {/* Header */}
      <div className="border-b border-white/8 bg-black/30 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-primary transition-colors font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="w-px h-4 bg-white/10" />
          <h1 className="text-sm font-black text-white">Payment</h1>
          <div className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-5">

        {/* ── Car summary ── */}
        {loadingCar ? (
          <div className="bg-white/5 border border-white/8 rounded-3xl p-4 animate-pulse h-24" />
        ) : car && (
          <div className="bg-white/5 border border-white/8 rounded-3xl p-4 flex items-center gap-4 backdrop-blur-sm">
            <div className="w-20 h-16 rounded-2xl overflow-hidden bg-white/10 shrink-0">
              {car.imageUrl ? (
                <Image src={car.imageUrl} alt={car.model} width={80} height={64} className="object-cover w-full h-full" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 font-medium">{car.carClass}</p>
              <p className="text-base font-black text-white">{car.model}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{PKG_LABEL[pkg]}</p>
              {discountPct > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 ${tierMeta.bg} ${tierMeta.color}`}>
                  {tierMeta.icon} {discountPct}% off
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              {discountedNum && (
                <p className="text-xs text-zinc-500 line-through">{basePrice}</p>
              )}
              <p className="text-xl font-black text-primary">{price}</p>
              <p className="text-xs text-zinc-500">{PKG_UNIT[pkg]}</p>
            </div>
          </div>
        )}

        {/* ── Loyalty discount banner ── */}
        {discountPct > 0 && (
          <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${tierMeta.bg} border-current/20`}>
            <span className="text-2xl">{tierMeta.icon || "🎁"}</span>
            <div>
              <p className={`text-sm font-black ${tierMeta.color}`}>{discountTier} Member — {discountPct}% discount applied</p>
              <p className="text-xs text-zinc-400">
                {isFlexPkg
                  ? "Per-minute rate discounted at trip end"
                  : `You save ${(parseFloat(basePrice) - parseFloat(price)).toFixed(2)} TJS on this booking`}
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
            <p className="text-sm text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* ── Saved card banner ── */}
        {savedCard && (
          <div className={`rounded-2xl border p-4 flex items-center justify-between gap-3 transition-all backdrop-blur-sm ${
            usingSaved ? "bg-primary/5 border-primary/30" : "bg-white/5 border-white/8"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Saved card</p>
                <p className="text-sm font-black text-white font-mono">{maskNumber(savedCard.number)}</p>
                <p className="text-xs text-zinc-500">{savedCard.name}</p>
              </div>
            </div>
            <button type="button" onClick={() => setUsingSaved((v) => !v)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                usingSaved ? "bg-primary text-white" : "bg-white/10 text-zinc-300"
              }`}>
              {usingSaved ? "Using ✓" : "Use"}
            </button>
          </div>
        )}

        {/* ── Card UI + fields ── */}
        <div className="bg-white/5 border border-white/8 rounded-3xl overflow-hidden backdrop-blur-sm">

          {/* Visual card */}
          <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 m-4 rounded-2xl overflow-hidden select-none">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white" />
              <div className="absolute -bottom-6 -left-6 w-44 h-44 rounded-full bg-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300 to-amber-500" />
                <div className="flex gap-1">
                  <div className="w-7 h-7 rounded-full bg-red-500/70" />
                  <div className="w-7 h-7 rounded-full bg-amber-400/70 -ml-3" />
                </div>
              </div>
              <p className="text-white font-mono text-xl tracking-[0.2em] mb-6 drop-shadow">
                {usingSaved && savedCard ? maskNumber(savedCard.number) : (number || "•••• •••• •••• ••••")}
              </p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Cardholder</p>
                  <p className="text-white font-bold text-sm uppercase">{name || "YOUR NAME"}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Expires</p>
                  <p className="text-white font-bold text-sm">
                    {usingSaved && savedCard ? savedCard.expiry : (expiry || "MM/YY")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Input fields — hidden when using saved card */}
          {(!usingSaved || !savedCard) && (
            <div className="px-4 pb-5 flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Cardholder name</label>
                <input type="text" required value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="JOHN SMITH"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-primary transition-colors font-mono uppercase" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Card number</label>
                <input type="text" inputMode="numeric" required value={number}
                  onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-primary transition-colors font-mono tracking-widest" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Expiry</label>
                  <input type="text" inputMode="numeric" required value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-primary transition-colors font-mono" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">CVV</label>
                  <input type="password" inputMode="numeric" required value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="•••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-primary transition-colors font-mono" />
                </div>
              </div>

              {!savedCard && (
                <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
                  <button type="button" onClick={() => setSaveCard((v) => !v)}
                    className={`w-11 h-6 rounded-full transition-colors shrink-0 relative ${saveCard ? "bg-primary" : "bg-white/10"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${saveCard ? "left-6" : "left-1"}`} />
                  </button>
                  <span className="text-sm text-zinc-400 font-medium">Save card for next time</span>
                </label>
              )}
            </div>
          )}

          {usingSaved && savedCard && (
            <div className="px-4 pb-5">
              <button type="button"
                onClick={() => { setUsingSaved(false); setSavedCard(null); localStorage.removeItem(CARD_KEY); }}
                className="text-sm text-primary font-bold hover:underline">
                Use a different card
              </button>
            </div>
          )}
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Payments are encrypted · CVV is never stored
        </div>

        {/* Pay button */}
        <button type="submit"
          className="w-full bg-primary hover:bg-primary-hover text-white font-black text-lg py-5 rounded-2xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98] flex items-center justify-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Pay & Reserve · {price} {PKG_UNIT[pkg]}
        </button>
      </form>
    </div>
  );
}
