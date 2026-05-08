"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/src/i18n/navigation";
import { Navbar } from "@/src/components/landing/Navbar";

type CarClass = "ECONOMY" | "COMFORT" | "CROSSOVER";
type PkgKey   = "flex" | "3h" | "6h" | "24h";

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
  latitude: number;
  longitude: number;
  tariff: Tariff | null;
  zone: string | null;
  distance_km: number | null;
}

const classMeta: Record<CarClass, { label: string; color: string; bg: string; emoji: string }> = {
  ECONOMY:   { label: "Economy",   color: "text-green-600 dark:text-green-400",  bg: "bg-green-500/10",  emoji: "🚗" },
  COMFORT:   { label: "Comfort",   color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-500/10",   emoji: "🚕" },
  CROSSOVER: { label: "Crossover", color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/10",  emoji: "🚙" },
};

interface PkgDef {
  key: PkgKey;
  label: string;
  sublabel: string;
  getPrice: (t: Tariff) => string;
  unit: string;
  flex: boolean;
  km: string | null;
}

const PACKAGES: PkgDef[] = [
  { key: "flex", label: "Flex",  sublabel: "Any time", getPrice: (t) => t.perMinDriving.toFixed(2), unit: "TJS/min", flex: true,  km: null },
  { key: "3h",   label: "3H",   sublabel: "3 hours",  getPrice: (t) => String(t.package3h),         unit: "TJS",     flex: false, km: "50 km" },
  { key: "6h",   label: "6H",   sublabel: "6 hours",  getPrice: (t) => String(t.package6h),         unit: "TJS",     flex: false, km: "100 km" },
  { key: "24h",  label: "24H",  sublabel: "24 hours", getPrice: (t) => String(t.package24h),        unit: "TJS",     flex: false, km: "200 km" },
];

const zoneMeta: Record<string, { label: string; color: string; dot: string }> = {
  green:  { label: "City Center",  color: "text-green-600 dark:text-green-400",  dot: "bg-green-500" },
  yellow: { label: "City Area",    color: "text-amber-600 dark:text-amber-400",  dot: "bg-amber-500" },
  red:    { label: "Outside City", color: "text-red-600 dark:text-red-400",      dot: "bg-red-500"   },
};

declare global {
  interface Window { ymaps: unknown; }
}

export default function CarDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const initialPkg = searchParams.get("pkg") as PkgKey | null;

  const [car, setCar]         = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [pkg, setPkg]         = useState<PkgKey>(
    initialPkg && ["flex","3h","6h","24h"].includes(initialPkg) ? initialPkg : "flex"
  );
  const [mapReady, setMapReady] = useState(false);

  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const ymapsRef    = useRef<unknown>(null);

  /* ── Fetch car from public endpoint ── */
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars/public`)
      .then((r) => r.json())
      .then((d) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = d.data ?? d.cars ?? [];
        const found = list.find((c) => c.id === id) ?? null;
        setCar(found);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Load Yandex Maps script ── */
  useEffect(() => {
    if (document.getElementById("ymaps-script")) {
      if (window.ymaps) { ymapsRef.current = window.ymaps; setMapReady(true); }
      return;
    }
    const key = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY ?? "";
    const script = document.createElement("script");
    script.id = "ymaps-script";
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${key}&lang=en_US`;
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.ymaps as any).ready(() => {
        ymapsRef.current = window.ymaps;
        setMapReady(true);
      });
    };
    document.head.appendChild(script);
  }, []);

  /* ── Init map once car data + script ready ── */
  useEffect(() => {
    if (!mapReady || !car || !mapRef.current || mapInstance.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ymaps = ymapsRef.current as any;

    const map = new ymaps.Map(mapRef.current, {
      center: [car.latitude, car.longitude],
      zoom: 16,
      type: "yandex#map",
      controls: ["zoomControl"],
    });

    map.options.set("suppressMapOpenBlock", true);
    map.panes.get("ground").getElement().style.filter = "invert(90%) hue-rotate(180deg)";

    const carIcon = ymaps.templateLayoutFactory.createClass(
      `<div style="
        width:44px;height:44px;border-radius:50%;
        background:#2D8A1E;border:3px solid #fff;
        box-shadow:0 4px 16px rgba(45,138,30,0.5);
        display:flex;align-items:center;justify-content:center;
        font-size:20px;transform:translate(-50%,-50%);
      ">🚗</div>`
    );

    const placemark = new ymaps.Placemark(
      [car.latitude, car.longitude],
      { hintContent: car.model },
      { iconLayout: carIcon, iconShape: { type: "Circle", coordinates: [0, 0], radius: 22 } }
    );

    map.geoObjects.add(placemark);
    mapInstance.current = map;
  }, [mapReady, car]);

  const pkgDef = PACKAGES.find((p) => p.key === pkg)!;
  const tariff = car?.tariff ?? null;
  const price  = tariff ? pkgDef.getPrice(tariff) : "—";
  const meta   = car ? classMeta[car.carClass] : null;
  const zone   = car?.zone ? zoneMeta[car.zone] ?? zoneMeta.yellow : null;

  return (
    <div className="min-h-screen pt-16">
      <Navbar />

      {/* ── Back bar ── */}
      <div className="border-b border-white/8 bg-black/30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => router.push("/client/fleet")}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-primary transition-colors font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Fleet
          </button>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-sm text-white font-bold">{car?.model ?? "Car Details"}</span>
        </div>
      </div>

      {loading ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-6 animate-pulse">
          <div className="aspect-[16/7] bg-white/10 rounded-3xl" />
          <div className="h-80 bg-white/10 rounded-3xl" />
        </div>
      ) : !car ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-zinc-400 text-sm font-medium">Car not found</p>
          <button onClick={() => router.push("/client/fleet")}
            className="text-sm text-primary font-bold hover:underline">Back to Fleet</button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6 pb-32">

          {/* ── Hero image ── */}
          <div className="relative rounded-3xl overflow-hidden bg-white/5 aspect-[16/7]">
            {car.imageUrl ? (
              <Image src={car.imageUrl} alt={car.model} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1V5h4l3 5v5h-1m-1 1H9" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {meta && (
                <span className={`text-xs font-black px-3 py-1.5 rounded-full backdrop-blur-sm bg-black/50 ${meta.color}`}>
                  {meta.emoji} {meta.label}
                </span>
              )}
              {zone && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm bg-black/50 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${zone.dot}`} />
                  <span className={zone.color}>{zone.label}</span>
                </span>
              )}
            </div>

            {car.year && (
              <span className="absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
                {car.year}
              </span>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h1 className="text-3xl font-black text-white drop-shadow-md">{car.model}</h1>
            </div>
          </div>

          {/* ── Quick info row ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Class", value: meta?.label ?? car.carClass, icon: meta?.emoji ?? "🚗" },
              { label: "Fuel", value: car.fuelLevel !== null ? `${car.fuelLevel}%` : "—", icon: "⛽" },
              { label: "Status", value: "Available", icon: "✅" },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 border border-white/8 rounded-2xl p-4 flex flex-col gap-1 backdrop-blur-sm">
                <span className="text-lg leading-none">{item.icon}</span>
                <p className="text-xs text-zinc-500 font-medium mt-1">{item.label}</p>
                <p className="text-sm font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {/* ── Features ── */}
          {(car.features.length > 0 || car.tariff?.includesFuel || car.tariff?.includesParkingWash) && (
            <div className="bg-white/5 border border-white/8 rounded-3xl p-6 backdrop-blur-sm">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">Included</h2>
              <div className="grid grid-cols-2 gap-2">
                {car.tariff?.includesFuel && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Fuel included
                  </div>
                )}
                {car.tariff?.includesParkingWash && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Free parking & wash
                  </div>
                )}
                {car.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                    <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Map ── */}
          <div className="bg-white/5 border border-white/8 rounded-3xl overflow-hidden backdrop-blur-sm">
            <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/8">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Car Location</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Walk to this car and start your trip</p>
              </div>
              {car.distance_km !== null && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {car.distance_km < 1 ? `${Math.round(car.distance_km * 1000)} m away` : `${car.distance_km.toFixed(1)} km away`}
                </span>
              )}
            </div>
            <div ref={mapRef} className="w-full h-72" />
          </div>

          {/* ── Pricing / Package selector ── */}
          {tariff && (
            <div className="bg-white/5 border border-white/8 rounded-3xl p-6 backdrop-blur-sm">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">Choose Package</h2>

              {/* Pills */}
              <div className="grid grid-cols-4 gap-2 bg-black/20 rounded-2xl p-1.5">
                {PACKAGES.map((p) => {
                  const active = pkg === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => setPkg(p.key)}
                      className={`flex flex-col items-center py-3 px-1 rounded-xl transition-all ${
                        active
                          ? "bg-white/10 shadow-sm"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <span className={`text-[13px] font-black leading-none ${
                        active ? (p.flex ? "text-primary" : "text-white") : "text-zinc-500"
                      }`}>
                        {p.label}
                      </span>
                      <span className={`text-[10px] mt-1 ${active ? "text-zinc-400" : "text-zinc-600"}`}>
                        {p.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Price display */}
              <div className={`mt-3 flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                pkgDef.flex
                  ? "bg-primary/5 border-primary/20"
                  : "bg-white/5 border-white/8"
              }`}>
                <div>
                  <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wide">
                    {pkgDef.flex ? "Per minute · no time limit" : `${pkgDef.sublabel} · ${pkgDef.km} included`}
                  </p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-primary">{price}</span>
                    <span className="text-sm text-zinc-500">{pkgDef.unit}</span>
                  </div>
                </div>
                {pkgDef.flex ? (
                  <span className="text-3xl">⏱️</span>
                ) : (
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 mb-0.5">Extra km</p>
                    <p className="text-sm font-bold text-zinc-300">2.00 TJS/km</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Sticky Reserve button ── */}
      {car && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-t border-white/10 px-4 py-4 safe-area-pb">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            {tariff && (
              <div className="shrink-0">
                <p className="text-[10px] text-zinc-500 font-medium leading-none">Selected</p>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                  <span className="text-xl font-black text-primary">{price}</span>
                  <span className="text-xs text-zinc-500 ml-0.5">{pkgDef.unit}</span>
                </div>
              </div>
            )}
            <button
              onClick={() => router.push(`/client/payment/${car.id}?pkg=${pkg}`)}
              className="flex-1 bg-primary hover:bg-primary-hover text-white font-black text-base py-4 rounded-2xl transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
            >
              Reserve · {pkgDef.label}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
