"use client";

import { useState } from "react";
import { Link } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";

type CarClass = "ECONOMY" | "COMFORT" | "CROSSOVER";

const CATEGORIES: {
  id: CarClass;
  label: string;
  emoji: string;
  desc: string;
  color: string;
  ring: string;
}[] = [
  {
    id: "ECONOMY",
    label: "Economy",
    emoji: "🚗",
    desc: "Affordable daily rides",
    color: "text-green-600 dark:text-green-400",
    ring: "ring-green-500/30",
  },
  {
    id: "COMFORT",
    label: "Comfort",
    emoji: "🚕",
    desc: "Premium sedans & hatches",
    color: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/30",
  },
  {
    id: "CROSSOVER",
    label: "Crossover",
    emoji: "🚙",
    desc: "SUVs for any terrain",
    color: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
  },
];

const TARIFFS: Record<CarClass, { perMin: string; p3h: string; p6h: string; p12h: string; p24h: string }> = {
  ECONOMY:   { perMin: "1.50", p3h: "150",  p6h: "250",  p12h: "400",  p24h: "550"  },
  COMFORT:   { perMin: "2.20", p3h: "220",  p6h: "380",  p12h: "600",  p24h: "850"  },
  CROSSOVER: { perMin: "3.00", p3h: "320",  p6h: "550",  p12h: "900",  p24h: "1200" },
};

export function PackagesSection() {
  const t = useTranslations("landing.packages");
  const [selected, setSelected] = useState<CarClass>("ECONOMY");

  const tariff = TARIFFS[selected];
  const cat    = CATEGORIES.find((c) => c.id === selected)!;

  const packages = [
    {
      name: "Flex Ride",
      badge: "New",
      note: "Drive 1 min or 10 hours — pay only for what you use",
      hours: "Any",
      km: "Unlimited",
      price: tariff.perMin,
      unit: "TJS/min",
      flex: true,
      popular: false,
      pkgKey: "flex",
    },
    { name: "Morning Rush", badge: null, note: null, hours: "3h",  km: "50 km",  price: tariff.p3h,  unit: "TJS", flex: false, popular: false, pkgKey: "3h"   },
    { name: "City Explorer", badge: null, note: null, hours: "6h",  km: "100 km", price: tariff.p6h,  unit: "TJS", flex: false, popular: false, pkgKey: "6h"   },
    { name: "Day Tripper",   badge: null, note: null, hours: "12h", km: "150 km", price: tariff.p12h, unit: "TJS", flex: false, popular: true,  pkgKey: "24h"  },
    { name: "Full Freedom",  badge: null, note: null, hours: "24h", km: "200 km", price: tariff.p24h, unit: "TJS", flex: false, popular: false, pkgKey: "24h"  },
  ];

  return (
    <section id="pricing" className="py-24" style={{ background: "radial-gradient(ellipse at 65% 40%, #1a3a6e 0%, #0f2147 40%, #070d1f 100%)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Heading ── */}
        <div className="text-center mb-10">
          <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">{t("subtitle")}</p>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white">{t("title")}</h2>
          <p className="text-gray-500 dark:text-zinc-400 mt-3 text-lg">{t("description")}</p>
        </div>

        {/* ── Category selector (Uber-style) ── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {CATEGORIES.map((c) => {
            const active = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`relative flex flex-col items-center gap-2 py-5 px-4 rounded-2xl border-2 transition-all duration-200 ${
                  active
                    ? `border-current bg-white dark:bg-zinc-800 shadow-lg ring-4 ${c.ring} ${c.color}`
                    : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:border-gray-300 dark:hover:border-zinc-600"
                }`}
              >
                {/* Checkmark when active */}
                {active && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-current flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}

                <span className="text-3xl leading-none">{c.emoji}</span>
                <span className={`text-sm font-black uppercase tracking-wide ${active ? c.color : ""}`}>{c.label}</span>
                <span className={`text-[11px] text-center leading-tight ${active ? "opacity-70" : "text-gray-400 dark:text-zinc-500"}`}>{c.desc}</span>

                {/* Price preview */}
                <div className={`mt-1 text-xs font-bold px-3 py-1 rounded-full ${active ? "bg-current/10" : "bg-gray-100 dark:bg-zinc-700"}`}>
                  <span className={active ? c.color : "text-gray-400"}>
                    from {TARIFFS[c.id].perMin} TJS/min
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Selected category label ── */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="text-lg">{cat.emoji}</span>
          <p className={`text-sm font-black uppercase tracking-widest ${cat.color}`}>{cat.label} pricing</p>
          <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700 ml-2" />
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden md:block bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-700">
                {["Package", "Category", "Hours", "Included KM", "Price", ""].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr
                  key={pkg.name}
                  className={`border-b border-gray-50 dark:border-zinc-700/60 last:border-0 transition-colors ${
                    pkg.flex
                      ? "bg-primary/[0.03] hover:bg-primary/[0.06] dark:bg-primary/[0.05]"
                      : pkg.popular
                      ? "bg-primary/[0.02] hover:bg-gray-50/80 dark:hover:bg-zinc-700/40"
                      : "hover:bg-gray-50/60 dark:hover:bg-zinc-700/30"
                  }`}
                >
                  {/* Package name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white">{pkg.name}</span>
                      {pkg.badge && (
                        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wide">{pkg.badge}</span>
                      )}
                      {pkg.popular && (
                        <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">{t("popular")}</span>
                      )}
                    </div>
                    {pkg.note && <p className="text-[11px] text-gray-400 mt-0.5">{pkg.note}</p>}
                  </td>

                  {/* Category badge */}
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${
                      selected === "ECONOMY"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                        : selected === "COMFORT"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}>
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </div>
                  </td>

                  {/* Hours */}
                  <td className={`px-6 py-4 font-medium text-sm ${pkg.flex ? "text-primary font-bold" : "text-gray-500 dark:text-zinc-400"}`}>
                    {pkg.hours}
                  </td>

                  {/* KM */}
                  <td className={`px-6 py-4 font-medium text-sm ${pkg.flex ? "text-primary font-bold" : "text-gray-500 dark:text-zinc-400"}`}>
                    {pkg.km}
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-primary font-black text-xl">{pkg.price}</span>
                      <span className="text-gray-400 text-xs">{pkg.unit}</span>
                    </div>
                  </td>

                  {/* CTA */}
                  <td className="px-6 py-4">
                    <Link
                      href={`/client/fleet?class=${selected}&pkg=${pkg.pkgKey}`}
                      className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                        pkg.popular
                          ? "bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/20"
                          : pkg.flex
                          ? "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                          : "bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-300"
                      }`}
                    >
                      {t("choose")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards ── */}
        <div className="md:hidden flex flex-col gap-3">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`rounded-2xl border p-4 bg-white dark:bg-zinc-800 shadow-sm flex items-center gap-4 ${
                pkg.flex
                  ? "border-primary/30 ring-1 ring-primary/10"
                  : pkg.popular
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-gray-100 dark:border-zinc-700"
              }`}
            >
              {/* Category dot */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                selected === "ECONOMY" ? "bg-green-500/10" : selected === "COMFORT" ? "bg-blue-500/10" : "bg-amber-500/10"
              }`}>
                {cat.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{pkg.name}</span>
                  {pkg.badge && <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-black uppercase">{pkg.badge}</span>}
                  {pkg.popular && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">{t("popular")}</span>}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{pkg.hours} · {pkg.km}</p>
              </div>

              {/* Price + CTA */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-primary font-black text-base">{pkg.price}</span>
                  <span className="text-gray-400 text-[10px] ml-0.5">{pkg.unit}</span>
                </div>
                <Link
                  href={`/client/fleet?class=${selected}&pkg=${pkg.pkgKey}`}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    pkg.popular
                      ? "bg-primary hover:bg-primary-hover text-white"
                      : "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  {t("choose")}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">{t("extraKm")}</p>
      </div>
    </section>
  );
}
