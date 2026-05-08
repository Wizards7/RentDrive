"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ─── Types ─── */
interface IdleCar {
  id: string;
  model: string;
  class: "ECONOMY" | "COMFORT" | "CROSSOVER";
  plate: string;
  fuel: number;
  lat: number;
  lng: number;
}

interface ActiveTrip {
  id: string;
  carModel: string;
  driverName: string;
  phone: string;
  speed: number;
  street: string;
  startedAt: string;
  lat: number;
  lng: number;
}

interface ZoneAlert {
  id: string;
  type: "left_green" | "entered_red" | "returned";
  message: string;
  driver: string;
  car: string;
  coords: [number, number];
  time: Date;
  read: boolean;
}

/* ─── Zone polygons (Dushanbe) ─── */

/* Outer orange rectangle — full operational boundary */
const OUTER_ZONE: [number, number][] = [
  [38.6450, 68.6400],
  [38.6450, 68.9100],
  [38.4650, 68.9100],
  [38.4650, 68.6400],
];

/* Inner green rectangle — service zone (central Dushanbe) */
const GREEN_ZONE: [number, number][] = [
  [38.5950, 68.7250],
  [38.5950, 68.8050],
  [38.5220, 68.8050],
  [38.5220, 68.7250],
];

const RED_ZONES: { id: string; label: string; coords: [number, number][] }[] = [];

/* ─── Point-in-polygon (ray casting) ─── */
function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  let inside = false;
  const [px, py] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/* ─── Mock data ─── */
const IDLE_CARS: IdleCar[] = [
  { id: "c1", model: "Chevrolet Cobalt",   class: "ECONOMY",   plate: "TJ 001 AA", fuel: 82, lat: 38.5650, lng: 68.7720 },
  { id: "c2", model: "Toyota Vitz",        class: "ECONOMY",   plate: "TJ 002 BB", fuel: 55, lat: 38.5530, lng: 68.7900 },
  { id: "c3", model: "Kia Rio",            class: "COMFORT",   plate: "TJ 003 CC", fuel: 91, lat: 38.5700, lng: 68.8020 },
  { id: "c4", model: "Volkswagen Polo",    class: "ECONOMY",   plate: "TJ 004 DD", fuel: 43, lat: 38.5480, lng: 68.7650 },
  { id: "c5", model: "Hyundai Tucson",     class: "CROSSOVER", plate: "TJ 005 EE", fuel: 76, lat: 38.5620, lng: 68.8100 },
  { id: "c6", model: "Nissan Qashqai",     class: "CROSSOVER", plate: "TJ 006 FF", fuel: 68, lat: 38.5730, lng: 68.7580 },
  { id: "c7", model: "Kia Sportage",       class: "CROSSOVER", plate: "TJ 007 GG", fuel: 88, lat: 38.5550, lng: 68.7840 },
];

const INITIAL_TRIP: ActiveTrip = {
  id: "t1",
  carModel: "Hongqi E-HS3",
  driverName: "Alijon Toshev",
  phone: "+992 99 999 9999",
  speed: 42,
  street: "Rudaki Ave, Dushanbe",
  startedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  lat: 38.5598,
  lng: 68.7870,
};

const CLASS_COLOR: Record<string, string> = {
  ECONOMY:   "#22c55e",
  COMFORT:   "#60a5fa",
  CROSSOVER: "#f59e0b",
};

function elapsed(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function FuelBar({ pct }: { pct: number }) {
  const color = pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-white/40">{pct}%</span>
    </div>
  );
}

declare global { interface Window { ymaps: unknown } }

export default function FleetMapPage() {
  const mapRef          = useRef<HTMLDivElement>(null);
  const mapInst         = useRef<unknown>(null);
  const ymapsRef        = useRef<unknown>(null);
  const idleMarkers     = useRef<Map<string, unknown>>(new Map());
  const activePlacemark = useRef<unknown>(null);
  const greenZoneRef    = useRef<unknown>(null);
  const redZoneRefs     = useRef<unknown[]>([]);
  const wasInGreen      = useRef(true);
  const wasInRed        = useRef(false);

  const [mapReady, setMapReady]             = useState(false);
  const [trip, setTrip]                     = useState<ActiveTrip>(INITIAL_TRIP);
  const [selectedTrip, setSelectedTrip]     = useState(false);
  const [filter, setFilter]                 = useState<"ALL" | "ECONOMY" | "COMFORT" | "CROSSOVER">("ALL");
  const [showZones, setShowZones]           = useState(true);
  const [alerts, setAlerts]                 = useState<ZoneAlert[]>([]);
  const [showAlerts, setShowAlerts]         = useState(false);
  const [liveToast, setLiveToast]           = useState<ZoneAlert | null>(null);
  const [carInGreen, setCarInGreen]         = useState(true);
  const [carInRed, setCarInRed]             = useState(false);

  /* ── Load Yandex Maps ── */
  useEffect(() => {
    if (document.getElementById("ymaps-fleet")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).ymaps) { ymapsRef.current = (window as any).ymaps; setMapReady(true); }
      return;
    }
    const key = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY ?? "";
    const s = document.createElement("script");
    s.id = "ymaps-fleet";
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${key}&lang=en_US`;
    s.async = true;
    s.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).ymaps.ready(() => { ymapsRef.current = (window as any).ymaps; setMapReady(true); });
    };
    document.head.appendChild(s);
  }, []);

  /* ── Init map ── */
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInst.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ymaps = ymapsRef.current as any;

    const map = new ymaps.Map(mapRef.current, {
      center: [38.5598, 68.7870],
      zoom: 13,
      type: "yandex#map",
      controls: [],
    });
    map.options.set("suppressMapOpenBlock", true);
    map.panes.get("ground").getElement().style.filter = "invert(90%) hue-rotate(180deg)";

    /* ── Outer orange boundary ── */
    const outerPoly = new ymaps.Polygon(
      [OUTER_ZONE],
      { hintContent: "Operational Boundary" },
      {
        fillColor: "#f59e0b",
        fillOpacity: 0.10,
        strokeColor: "#f59e0b",
        strokeWidth: 2,
        strokeOpacity: 0.85,
        strokeStyle: "solid",
      }
    );
    map.geoObjects.add(outerPoly);
    redZoneRefs.current.push(outerPoly);

    /* ── Inner green service zone ── */
    const greenPoly = new ymaps.Polygon(
      [GREEN_ZONE],
      { hintContent: "Service Zone" },
      {
        fillColor: "#22c55e",
        fillOpacity: 0.13,
        strokeColor: "#22c55e",
        strokeWidth: 2,
        strokeOpacity: 0.85,
        strokeStyle: "solid",
      }
    );
    map.geoObjects.add(greenPoly);
    greenZoneRef.current = greenPoly;

    /* ── Idle car markers ── */
    IDLE_CARS.forEach((car) => {
      const color = CLASS_COLOR[car.class];
      const layout = ymaps.templateLayoutFactory.createClass(
        `<div style="width:36px;height:36px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%)">
          <div style="width:12px;height:12px;border-radius:50%;background:${color}"></div>
        </div>`
      );
      const mark = new ymaps.Placemark(
        [car.lat, car.lng],
        { hintContent: `${car.model} · ${car.plate}` },
        { iconLayout: layout, iconShape: { type: "Circle", coordinates: [0, 0], radius: 18 } }
      );
      map.geoObjects.add(mark);
      idleMarkers.current.set(car.id, mark);
    });

    /* ── Active trip marker ── */
    const activeLayout = ymaps.templateLayoutFactory.createClass(
      `<div style="position:relative;width:48px;height:48px;transform:translate(-50%,-50%)">
        <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.25;animation:ping 1.5s ease-out infinite"></div>
        <div style="position:absolute;inset:6px;border-radius:50%;background:#1d4ed8;border:2px solid #93c5fd;display:flex;align-items:center;justify-content:center">
          <div style="width:10px;height:10px;border-radius:50%;background:#fff"></div>
        </div>
      </div>
      <style>@keyframes ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}</style>`
    );
    const amark = new ymaps.Placemark(
      [INITIAL_TRIP.lat, INITIAL_TRIP.lng],
      { hintContent: `🚗 ${INITIAL_TRIP.driverName}` },
      { iconLayout: activeLayout, iconShape: { type: "Circle", coordinates: [0, 0], radius: 24 } }
    );
    amark.events.add("click", () => setSelectedTrip((v) => !v));
    map.geoObjects.add(amark);
    activePlacemark.current = amark;
    mapInst.current = map;
  }, [mapReady]);

  /* ── Toggle zone visibility ── */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (greenZoneRef.current as any)?.options?.set("visible", showZones);
    redZoneRefs.current.forEach((rz) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rz as any)?.options?.set("visible", showZones);
    });
  }, [showZones]);

  /* ── GPS simulation + zone detection ── */
  useEffect(() => {
    const id = setInterval(() => {
      setTrip((prev) => {
        const newLat   = prev.lat + (Math.random() - 0.48) * 0.0003;
        const newLng   = prev.lng + (Math.random() - 0.35) * 0.0004;
        const newSpeed = Math.max(10, Math.min(80, prev.speed + (Math.random() - 0.5) * 10));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (activePlacemark.current as any)?.geometry?.setCoordinates([newLat, newLng]);

        /* ── Zone checks ── */
        const inGreen = pointInPolygon([newLat, newLng], GREEN_ZONE);
        const inOuter = pointInPolygon([newLat, newLng], OUTER_ZONE);
        /* "red" = outside the green zone boundary */
        const inRed = !inGreen;

        setCarInGreen(inGreen);
        setCarInRed(!inOuter); /* critical only if outside entire city boundary */

        if (!inGreen && wasInGreen.current) {
          wasInGreen.current = false;
          const alert: ZoneAlert = {
            id: Date.now().toString(),
            type: inOuter ? "left_green" : "entered_red",
            message: inOuter
              ? "Vehicle left the service zone!"
              : "Vehicle left the operational boundary!",
            driver: prev.driverName,
            car: prev.carModel,
            coords: [newLat, newLng],
            time: new Date(),
            read: false,
          };
          setAlerts((a) => [alert, ...a]);
          setLiveToast(alert);
        } else if (inGreen && !wasInGreen.current) {
          wasInGreen.current = true;
          const alert: ZoneAlert = {
            id: Date.now().toString(),
            type: "returned",
            message: "Vehicle returned to service zone",
            driver: prev.driverName,
            car: prev.carModel,
            coords: [newLat, newLng],
            time: new Date(),
            read: false,
          };
          setAlerts((a) => [alert, ...a]);
          setLiveToast(alert);
        }

        if (!inOuter && wasInRed.current) {
          wasInRed.current = false;
          const alert: ZoneAlert = {
            id: Date.now().toString(),
            type: "entered_red",
            message: "CRITICAL: Vehicle left the operational boundary!",
            driver: prev.driverName,
            car: prev.carModel,
            coords: [newLat, newLng],
            time: new Date(),
            read: false,
          };
          setAlerts((a) => [alert, ...a]);
          setLiveToast(alert);
        } else if (inOuter) {
          wasInRed.current = true;
        }

        void inRed;

        return { ...prev, lat: newLat, lng: newLng, speed: Math.round(newSpeed) };
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  /* ── Auto-dismiss live toast ── */
  useEffect(() => {
    if (!liveToast) return;
    const t = setTimeout(() => setLiveToast(null), 6000);
    return () => clearTimeout(t);
  }, [liveToast]);

  const panToActive = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInst.current as any)?.setCenter([trip.lat, trip.lng], 15, { duration: 500 });
  }, [trip.lat, trip.lng]);

  const panToIdle = useCallback((lat: number, lng: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInst.current as any)?.setCenter([lat, lng], 16, { duration: 400 });
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;
  const filtered    = filter === "ALL" ? IDLE_CARS : IDLE_CARS.filter((c) => c.class === filter);

  const ALERT_STYLE: Record<ZoneAlert["type"], { bg: string; border: string; icon: string; color: string }> = {
    left_green:  { bg: "bg-amber-500/10",  border: "border-amber-500/30",  icon: "⚠️", color: "text-amber-300" },
    entered_red: { bg: "bg-red-500/10",    border: "border-red-500/30",    icon: "🚨", color: "text-red-400"   },
    returned:    { bg: "bg-green-500/10",  border: "border-green-500/30",  icon: "✅", color: "text-green-400" },
  };

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 overflow-hidden">

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-80 shrink-0 bg-zinc-900 border-r border-white/8 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Fleet Dispatcher</h2>
            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <button
                onClick={() => { setShowAlerts((v) => !v); setAlerts((a) => a.map((x) => ({ ...x, read: true }))); }}
                className="relative w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                LIVE
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total",  value: IDLE_CARS.length + 1 },
              { label: "Idle",   value: IDLE_CARS.length },
              { label: "Active", value: 1 },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 rounded-xl p-2 text-center">
                <p className="text-base font-black text-white">{s.value}</p>
                <p className="text-[9px] text-white/40 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ALERTS PANEL ── */}
        {showAlerts && (
          <div className="border-b border-white/8 flex flex-col max-h-56 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Zone Alerts</p>
              {alerts.length > 0 && (
                <button onClick={() => setAlerts([])} className="text-[9px] text-white/20 hover:text-white/50 transition-colors">
                  Clear all
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-3 flex flex-col gap-2">
              {alerts.length === 0 ? (
                <p className="text-[11px] text-white/20 text-center py-3">No alerts yet</p>
              ) : (
                alerts.map((alert) => {
                  const s = ALERT_STYLE[alert.type];
                  return (
                    <div key={alert.id} className={`rounded-xl border p-2.5 ${s.bg} ${s.border}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-sm leading-none mt-0.5">{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${s.color} leading-tight`}>{alert.message}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{alert.car} · {alert.driver}</p>
                          <p className="text-[9px] text-white/20 mt-0.5">
                            {alert.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            {" · "}{alert.coords[0].toFixed(4)}, {alert.coords[1].toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── ZONE CONTROLS ── */}
        <div className="px-4 pt-3 pb-2 border-b border-white/8 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Zones</p>
            <button
              onClick={() => setShowZones((v) => !v)}
              className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all ${
                showZones
                  ? "bg-white/10 text-white/60 border-white/20"
                  : "bg-white/5 text-white/30 border-white/10"
              }`}
            >
              {showZones ? "Hide" : "Show"}
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {/* Inner green service zone */}
            <div className="flex items-center gap-2 bg-white/4 rounded-xl px-3 py-2">
              <div className="w-3 h-3 rounded-sm border-2 border-green-500 shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-white">Service Zone</p>
                <p className="text-[9px] text-white/30">Central Dushanbe</p>
              </div>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                carInGreen
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {carInGreen ? "IN" : "OUT"}
              </span>
            </div>
            {/* Outer orange operational boundary */}
            <div className="flex items-center gap-2 bg-white/4 rounded-xl px-3 py-2">
              <div className="w-3 h-3 rounded-sm border-2 border-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-white">Operational Area</p>
                <p className="text-[9px] text-white/30">Greater Dushanbe</p>
              </div>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                carInRed
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {carInRed ? "OUT!" : "IN"}
              </span>
            </div>
          </div>
        </div>

        {/* ── ACTIVE TRIPS ── */}
        <div className="px-4 pt-3 pb-2 border-b border-white/8 shrink-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Active Trips</p>
          <button
            onClick={() => { setSelectedTrip(true); panToActive(); }}
            className={`w-full flex items-start gap-3 p-3 rounded-2xl border transition-colors text-left ${
              !carInGreen || carInRed
                ? "bg-red-500/10 border-red-500/25 hover:bg-red-500/15"
                : "bg-blue-500/10 border-blue-500/25 hover:bg-blue-500/15"
            }`}
          >
            <div className="relative shrink-0 mt-0.5">
              <div className={`absolute inset-0 rounded-full animate-ping ${!carInGreen || carInRed ? "bg-red-500/30" : "bg-blue-500/30"}`} />
              <div className={`w-3 h-3 rounded-full border-2 relative ${!carInGreen || carInRed ? "bg-red-500 border-red-300" : "bg-blue-500 border-blue-300"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{trip.driverName}</p>
              <p className={`text-[11px] ${!carInGreen || carInRed ? "text-red-400" : "text-blue-400"}`}>{trip.carModel}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-white/40">{trip.speed} km/h</span>
                <span className="text-[10px] text-white/40">⏱ {elapsed(trip.startedAt)}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              {!carInGreen || carInRed ? (
                <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full font-bold">⚠ ZONE</span>
              ) : (
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-bold">ON TRIP</span>
              )}
            </div>
          </button>
        </div>

        {/* ── IDLE FLEET ── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Available Cars</p>
              <span className="text-[10px] text-white/30">{filtered.length}</span>
            </div>
            <div className="flex gap-1">
              {(["ALL", "ECONOMY", "COMFORT", "CROSSOVER"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                    filter === f ? "bg-primary text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                  }`}
                >
                  {f === "ALL" ? "All" : f.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2 min-h-0">
            {filtered.map((car) => (
              <button
                key={car.id}
                onClick={() => panToIdle(car.lat, car.lng)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all text-left shrink-0"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CLASS_COLOR[car.class] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{car.model}</p>
                  <p className="text-[10px] text-white/30">{car.plate}</p>
                  <FuelBar pct={car.fuel} />
                </div>
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: `${CLASS_COLOR[car.class]}18`,
                    color: CLASS_COLOR[car.class],
                    border: `1px solid ${CLASS_COLOR[car.class]}35`,
                  }}
                >
                  {car.class.slice(0, 3)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAP ── */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* ── LIVE TOAST NOTIFICATION ── */}
        {liveToast && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 w-80 rounded-2xl border shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300 ${
            liveToast.type === "returned"
              ? "bg-zinc-900/95 border-green-500/40"
              : liveToast.type === "entered_red"
              ? "bg-zinc-900/95 border-red-500/40"
              : "bg-zinc-900/95 border-amber-500/40"
          }`}>
            <div className={`px-4 py-3 flex items-start gap-3 ${
              liveToast.type === "returned"    ? "bg-green-500/10" :
              liveToast.type === "entered_red" ? "bg-red-500/10"   : "bg-amber-500/10"
            }`}>
              <span className="text-lg leading-none shrink-0 mt-0.5">
                {ALERT_STYLE[liveToast.type].icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black ${ALERT_STYLE[liveToast.type].color}`}>
                  {liveToast.message}
                </p>
                <p className="text-xs text-white/50 mt-0.5">{liveToast.car} · {liveToast.driver}</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {liveToast.coords[0].toFixed(5)}, {liveToast.coords[1].toFixed(5)}
                </p>
              </div>
              <button onClick={() => setLiveToast(null)} className="text-white/30 hover:text-white/60 transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Active trip popup */}
        {selectedTrip && (
          <div className="absolute top-4 right-4 z-30 w-64 bg-zinc-900/95 backdrop-blur-md border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 relative" />
                </div>
                <span className="text-xs font-black text-blue-300 uppercase tracking-wide">Live Tracking</span>
              </div>
              <button onClick={() => setSelectedTrip(false)} className="text-white/40 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Zone status badge */}
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
                carInRed
                  ? "bg-red-500/10 border-red-500/25"
                  : !carInGreen
                  ? "bg-amber-500/10 border-amber-500/25"
                  : "bg-green-500/10 border-green-500/25"
              }`}>
                <span className="text-sm">{carInRed ? "🚨" : !carInGreen ? "⚠️" : "✅"}</span>
                <p className={`text-xs font-bold ${carInRed ? "text-red-400" : !carInGreen ? "text-amber-400" : "text-green-400"}`}>
                  {carInRed ? "In restricted zone" : !carInGreen ? "Outside service zone" : "Inside service zone"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Driver</p>
                <p className="text-sm font-black text-white">{trip.driverName}</p>
                <p className="text-xs text-white/40">{trip.phone}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Vehicle</p>
                <p className="text-sm font-bold text-white">{trip.carModel}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 rounded-xl p-2 text-center">
                  <p className="text-base font-black text-blue-400">{trip.speed}</p>
                  <p className="text-[9px] text-white/30 uppercase">km/h</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2 text-center">
                  <p className="text-sm font-black text-white">{elapsed(trip.startedAt)}</p>
                  <p className="text-[9px] text-white/30 uppercase">Time</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2 text-center">
                  <p className="text-sm font-black text-primary">Live</p>
                  <p className="text-[9px] text-white/30 uppercase">GPS</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <div className="bg-white/5 rounded-xl px-2 py-2 text-center text-white/40 text-[10px]">
                  📍 {trip.lat.toFixed(4)}, {trip.lng.toFixed(4)}
                </div>
                <button
                  onClick={panToActive}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl px-3 py-2 text-center transition-colors text-[11px]"
                >
                  Pan to Car
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Legend</p>
          {[
            { color: "#22c55e", label: "Economy" },
            { color: "#60a5fa", label: "Comfort" },
            { color: "#f59e0b", label: "Crossover" },
            { color: "#3b82f6", label: "Active Trip", pulse: true },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="relative w-3 h-3 shrink-0 flex items-center justify-center">
                {l.pulse && <div className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: l.color }} />}
                <div className="w-3 h-3 rounded-full relative" style={{ background: l.color }} />
              </div>
              <span className="text-[10px] text-white/50">{l.label}</span>
            </div>
          ))}
          <div className="border-t border-white/8 pt-2 mt-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm border-2 border-green-500 opacity-70 shrink-0" />
              <span className="text-[10px] text-white/50">Service Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm border-2 border-amber-500 opacity-70 shrink-0" />
              <span className="text-[10px] text-white/50">Operational Area</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
