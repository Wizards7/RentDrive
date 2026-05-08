"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "@/src/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Navbar } from "@/src/components/landing/Navbar";

type CarClass  = "ECONOMY" | "COMFORT" | "CROSSOVER";
type PkgKey    = "flex" | "3h" | "6h" | "24h";

interface Tariff {
  perMinDriving: number;
  package3h: number;
  package6h: number;
  package24h: number;
  includesFuel: boolean;
  includesParkingWash: boolean;
}

interface Car {
  id: string;
  model: string;
  year: number | null;
  carClass: CarClass;
  features: string[];
  imageUrl: string | null;
  status: string;
  fuelLevel: number | null;
  tariff: Tariff | null;
  distance_km: number | null;
}

const classMeta: Record<CarClass, { label: string; badge: string; color: string; emoji: string }> = {
  ECONOMY:   { label: "Economy",   badge: "bg-zinc-800/80 text-zinc-300",          color: "text-zinc-400",   emoji: "🚗" },
  COMFORT:   { label: "Comfort",   badge: "bg-blue-500/20 text-blue-300",           color: "text-blue-400",   emoji: "🚕" },
  CROSSOVER: { label: "Crossover", badge: "bg-amber-500/20 text-amber-300",         color: "text-amber-400",  emoji: "🚙" },
};

const classOrder: CarClass[] = ["ECONOMY", "COMFORT", "CROSSOVER"];

export default function FleetPage() {
  const t = useTranslations("landing.fleet");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cars, setCars]       = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"ALL" | CarClass>("ALL");
  const [search, setSearch]   = useState("");

  /* Pre-select package from query param (set by pricing table "Choose" button) */
  const initialPkg = (searchParams.get("pkg") ?? "flex") as PkgKey;
  const [defaultPkg] = useState<PkgKey>(
    ["flex", "3h", "6h", "24h"].includes(initialPkg) ? initialPkg : "flex"
  );

  const initialFilter = searchParams.get("class") as "ALL" | CarClass | null;
  useEffect(() => {
    if (initialFilter && ["ECONOMY", "COMFORT", "CROSSOVER"].includes(initialFilter)) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars/public`)
      .then((r) => r.json())
      .then((d) => setCars(d.cars ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = cars
    .filter((c) => filter === "ALL" || c.carClass === filter)
    .filter((c) => c.model.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => classOrder.indexOf(a.carClass) - classOrder.indexOf(b.carClass));

  return (
    <div className="min-h-screen pt-16">
      <Navbar />

      {/* ── Sticky filter bar ── */}
      <div className="sticky top-16 z-40 border-b border-white/8 bg-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-primary transition-colors font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="w-px h-5 bg-white/10" />
            <div>
              <h1 className="text-xl font-black text-white leading-none">Our Fleet</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {loading ? "Loading…" : `${filtered.length} cars available`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 w-full sm:w-60 focus-within:border-primary transition-colors">
            <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search model…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-zinc-500 outline-none w-full" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {(["ALL", "ECONOMY", "COMFORT", "CROSSOVER"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                filter === f
                  ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:border-primary/40 hover:text-white"
              }`}>
              {f === "ALL" ? "All Cars" : `${classMeta[f].emoji} ${f}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-3xl overflow-hidden border border-white/8 animate-pulse">
                <div className="aspect-[16/10] bg-white/10" />
                <div className="p-6 flex flex-col gap-3">
                  <div className="h-3 w-16 bg-white/10 rounded" />
                  <div className="h-5 w-40 bg-white/10 rounded" />
                  <div className="h-10 bg-white/10 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-zinc-400 text-sm font-medium">No cars found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((car) => {
              const meta   = classMeta[car.carClass];
              const tariff = car.tariff;
              const minPrice = tariff?.perMinDriving.toFixed(2);

              return (
                <div
                  key={car.id}
                  onClick={() => router.push(`/client/cars/${car.id}?pkg=${defaultPkg}`)}
                  className="flex flex-col bg-white/5 border border-white/8 rounded-3xl overflow-hidden hover:border-white/20 hover:bg-white/8 transition-all group hover:-translate-y-1 cursor-pointer backdrop-blur-sm"
                >
                  {/* ── Car image ── */}
                  <div className="relative bg-gradient-to-br from-white/5 to-white/0">
                    <span className={`absolute top-4 left-4 z-10 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${meta.badge}`}>
                      {meta.emoji} {meta.label}
                    </span>
                    {car.year && (
                      <span className="absolute top-4 right-4 z-10 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/30 text-white backdrop-blur-sm">
                        {car.year}
                      </span>
                    )}
                    {car.distance_km !== null && (
                      <span className="absolute bottom-4 right-4 z-10 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {car.distance_km < 1 ? `${Math.round(car.distance_km * 1000)} m` : `${car.distance_km.toFixed(1)} km`}
                      </span>
                    )}
                    <div className="relative w-full aspect-[16/10] overflow-hidden">
                      {car.imageUrl ? (
                        <Image src={car.imageUrl} alt={car.model} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-zinc-600">
                          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1V5h4l3 5v5h-1m-1 1H9" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Card body ── */}
                  <div className="p-5 flex flex-col flex-1 gap-4">

                    {/* Model + class */}
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</p>
                      <h3 className="text-lg font-black text-white mt-0.5">{car.model}</h3>
                    </div>

                    {/* Features */}
                    <ul className="flex flex-col gap-1.5 flex-1">
                      {tariff?.includesFuel && (
                        <li className="flex items-center gap-2 text-sm text-zinc-400">
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Fuel included
                        </li>
                      )}
                      {tariff?.includesParkingWash && (
                        <li className="flex items-center gap-2 text-sm text-zinc-400">
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Free parking & wash
                        </li>
                      )}
                      {car.features.slice(0, 2).map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* Price row + CTA */}
                    <div className="flex items-center justify-between gap-3 mt-auto">
                      {minPrice && (
                        <div>
                          <p className="text-[10px] text-zinc-500 font-medium">from</p>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-xl font-black text-primary">{minPrice}</span>
                            <span className="text-xs text-zinc-500 ml-1">TJS/min</span>
                          </div>
                        </div>
                      )}
                      <button
                        className="flex-1 bg-primary hover:bg-primary-hover text-white text-sm font-bold py-3 rounded-2xl text-center transition-colors shadow-sm shadow-primary/20 flex items-center justify-center gap-2"
                      >
                        View & Reserve
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
