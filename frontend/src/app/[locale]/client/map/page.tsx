"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/src/hooks/redux";
import {
  setUserLocation,
  setVisibleCars,
  setSelectedCar,
  setClassFilter,
  setLocationPermission,
  selectUserLocation,
  selectVisibleCars,
  selectSelectedCar,
  selectClassFilter,
  selectLocationPermission,
  MapCar,
} from "@/src/store/slices/mapSlice";
import {
  selectIsAuthenticated,
  selectToken,
} from "@/src/store/slices/authSlice";
import { setActiveRental, ActiveRental } from "@/src/store/slices/rentalSlice";
import { ActiveTripOverlay } from "@/src/components/client/ActiveTripOverlay";
import { TripSummaryModal } from "@/src/components/client/TripSummaryModal";

/* ─── Dushanbe geofence zones ─── */
const DUSHANBE_CENTER = [38.559772, 68.773969] as const;

/* Green zone — Rudaki Ave corridor / city center (~4×3 km) */
const GREEN_ZONE = [
  [38.592, 68.745],
  [38.592, 68.808],
  [38.53, 68.808],
  [38.53, 68.745],
  [38.592, 68.745],
];

/* Yellow zone — full Dushanbe city bounds (~14×10 km) */
const YELLOW_ZONE = [
  [38.635, 68.675],
  [38.635, 68.875],
  [38.485, 68.875],
  [38.485, 68.675],
  [38.635, 68.675],
];

/* World bounding box for the inverted Red Zone */
const WORLD_BOX = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
  [-85, -180],
];

/* Tajikistan bounding box for coordinate validation */
const TJ_BOUNDS = { minLat: 36.7, maxLat: 41.0, minLon: 67.4, maxLon: 75.2 };
const isValidCoord = (lat: number, lon: number) =>
  typeof lat === "number" &&
  typeof lon === "number" &&
  lat >= TJ_BOUNDS.minLat &&
  lat <= TJ_BOUNDS.maxLat &&
  lon >= TJ_BOUNDS.minLon &&
  lon <= TJ_BOUNDS.maxLon;

function getZone(lat: number, lon: number): "green" | "yellow" | "red" {
  if (lat >= 38.53 && lat <= 38.592 && lon >= 68.745 && lon <= 68.808)
    return "green";
  if (lat >= 38.485 && lat <= 38.635 && lon >= 68.675 && lon <= 68.875)
    return "yellow";
  return "red";
}

type CarClass = "ECONOMY" | "COMFORT" | "CROSSOVER";

const CLASS_COLORS: Record<CarClass, string> = {
  ECONOMY: "#2D8A1E",
  COMFORT: "#3B82F6",
  CROSSOVER: "#F59E0B",
};

const CLASS_LABELS: Record<CarClass, string> = {
  ECONOMY: "Economy",
  COMFORT: "Comfort",
  CROSSOVER: "Crossover",
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function shuffleAndPick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

declare global {
  interface Window {
    ymaps: unknown;
  }
}

export default function MapPage() {
  const dispatch = useAppDispatch();
  const userLocation = useAppSelector(selectUserLocation);
  const visibleCars = useAppSelector(selectVisibleCars);
  const selectedCar = useAppSelector(selectSelectedCar);
  const classFilter = useAppSelector(selectClassFilter);
  const locationPermission = useAppSelector(selectLocationPermission);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const token = useAppSelector(selectToken);

  const mapRef = useRef<HTMLDivElement>(null);
  const ymapsRef = useRef<unknown>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersMapRef = useRef<Map<string, any>>(new Map());

  const [mapReady, setMapReady] = useState(false);
  const [allCars, setAllCars] = useState<MapCar[]>([]);
  const [hoveredCarId, setHoveredCarId] = useState<string | null>(null);
  const [guestModal, setGuestModal] = useState(false);
  const [zoneWarning, setZoneWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [selectedPkg, setSelectedPkg] = useState<"flex" | "3h" | "24h">("flex");
  const prevZoneRef = useRef<"green" | "yellow" | "red" | null>(null);

  /* ─── Load all public cars (pass GPS if available so backend pre-filters) ─── */
  const fetchCars = useCallback((lat?: number, lon?: number) => {
    const params = new URLSearchParams();
    if (lat !== undefined && lon !== undefined) {
      params.set("user_lat", String(lat));
      params.set("user_lng", String(lon));
    }
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars/public?${params}`)
      .then((r) => r.json())
      .then((d) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any[] = d.data ?? d.cars ?? [];
        const cars: MapCar[] = raw.map((c) => ({
          ...c,
          latitude: isValidCoord(c.latitude ?? c.lat, c.longitude ?? c.lng)
            ? Number(c.latitude ?? c.lat)
            : DUSHANBE_CENTER[0],
          longitude: isValidCoord(c.latitude ?? c.lat, c.longitude ?? c.lng)
            ? Number(c.longitude ?? c.lng)
            : DUSHANBE_CENTER[1],
          distanceMeters:
            c.distanceMeters ??
            (c.distance_km != null ? Math.round(c.distance_km * 1000) : 0),
        }));
        setAllCars(cars);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  /* ── Restore active rental on mount ── */
  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/rentals/active`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.rental) dispatch(setActiveRental(d.rental as ActiveRental));
      })
      .catch(() => {});
  }, [token, dispatch]);

  /* ─── Zone crossing detection ─── */
  useEffect(() => {
    if (!userLocation) return;
    const zone = getZone(userLocation.lat, userLocation.lon);
    if (prevZoneRef.current && prevZoneRef.current !== zone) {
      if (zone === "yellow") {
        setZoneWarning("Careful bro, you're leaving the free-parking zone!");
      } else if (zone === "red") {
        setZoneWarning(
          "⚠️ You've left the service area! Return charges may apply.",
        );
      } else if (zone === "green") {
        setZoneWarning("✓ Back in the free-parking zone!");
      }
      setTimeout(() => setZoneWarning(null), 5000);
    }
    prevZoneRef.current = zone;
  }, [userLocation]);

  /* ─── Load Yandex Maps script ─── */
  useEffect(() => {
    if (document.getElementById("ymaps-script")) {
      if (window.ymaps) {
        ymapsRef.current = window.ymaps;
        setMapReady(true);
      }
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

  /* ─── Init map once script is ready ─── */
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ymaps = ymapsRef.current as any;

    const map = new ymaps.Map(mapRef.current, {
      center: DUSHANBE_CENTER,
      zoom: 14,
      type: "yandex#map",
      controls: [],
    });

    map.options.set("suppressMapOpenBlock", true);
    map.options.set("yandexMapDisablePoiInteractivity", true);
    // These might not be officially supported in all versions but often work via options
    map.options.set("copyrightLogoVisible", false);
    map.options.set("copyrightProvidersVisible", false);
    map.options.set("copyrightUaVisible", false);

    /* Dark / modern style */
    map.panes.get("ground").getElement().style.filter =
      "invert(90%) hue-rotate(180deg)";

    /* ─── Geofence zones ─── */
    // Red zone: entire world MINUS the yellow area (inverted polygon)
    const redPoly = new ymaps.Polygon(
      [WORLD_BOX, YELLOW_ZONE],
      { hintContent: "Out of service area" },
      { fillColor: "#EF4444", fillOpacity: 0.13, strokeWidth: 0 },
    );

    // Yellow zone: area between yellow and green borders
    const yellowPoly = new ymaps.Polygon(
      [YELLOW_ZONE, GREEN_ZONE],
      { hintContent: "Caution — city outskirts" },
      {
        fillColor: "#F59E0B",
        fillOpacity: 0.18,
        strokeColor: "#F59E0B",
        strokeWidth: 1.5,
        opacity: 0.7,
      },
    );

    // Green zone: central permitted area
    const greenPoly = new ymaps.Polygon(
      [GREEN_ZONE],
      { hintContent: "Safe Zone — Dushanbe center" },
      {
        fillColor: "#2D8A1E",
        fillOpacity: 0.12,
        strokeColor: "#2D8A1E",
        strokeWidth: 1.5,
        opacity: 0.7,
      },
    );

    map.geoObjects.add(redPoly);
    map.geoObjects.add(yellowPoly);
    map.geoObjects.add(greenPoly);

    mapInstanceRef.current = map;
  }, [mapReady]);

  /* ─── GPS + pick visible cars ─── */
  const pickVisibleCars = useCallback(
    (lat: number, lon: number, filter: CarClass | null, cars: MapCar[]) => {
      const available = cars
        .filter((c) => c.status === "AVAILABLE")
        .map((c) => ({
          ...c,
          distanceMeters: Math.round(
            haversine(lat, lon, c.latitude, c.longitude),
          ),
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters);

      if (filter) {
        // Category selected: only that type; if none within 1km show 3 nearest of that type
        const ofType = available.filter((c) => c.carClass === filter);
        const nearbyOfType = ofType.filter((c) => c.distanceMeters <= 1000);
        const picked =
          nearbyOfType.length > 0 ? nearbyOfType : ofType.slice(0, 3);
        dispatch(setVisibleCars(picked));
        return picked;
      }

      // ALL: every available car within 1km, shuffle to max 8, fallback to 6 closest
      const nearby = available.filter((c) => c.distanceMeters <= 1000);
      const picked =
        nearby.length >= 3
          ? shuffleAndPick(nearby, Math.min(8, nearby.length))
          : available.slice(0, 6);
      dispatch(setVisibleCars(picked));
      return picked;
    },
    [dispatch],
  );

  // Run once on mount — re-running on allCars change causes infinite refetch loop
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        dispatch(setUserLocation({ lat, lon }));
        dispatch(setLocationPermission("granted"));
        fetchCars(lat, lon);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (mapInstanceRef.current)
          (mapInstanceRef.current as any).setCenter([lat, lon], 14);
      },
      () => {
        dispatch(setLocationPermission("denied"));
        // allCars effect below will pick visible cars at city center once cars load
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleZoom = useCallback((delta: number) => {
    if (!mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapInstanceRef.current as any;
    map.setZoom(map.getZoom() + delta, { smooth: true });
  }, []);

  const handleRequestLocation = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        dispatch(setUserLocation({ lat, lon }));
        dispatch(setLocationPermission("granted"));
        fetchCars(lat, lon);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (mapInstanceRef.current)
          (mapInstanceRef.current as any).setCenter([lat, lon], 15);
      },
      () => {
        dispatch(setLocationPermission("denied"));
      },
    );
  }, [dispatch, fetchCars]);

  /* ─── Re-pick when filter changes ─── */
  useEffect(() => {
    if (allCars.length === 0) return;
    const lat = userLocation?.lat ?? DUSHANBE_CENTER[0];
    const lon = userLocation?.lon ?? DUSHANBE_CENTER[1];
    pickVisibleCars(lat, lon, classFilter, allCars);
  }, [classFilter, allCars, userLocation, pickVisibleCars]);

  /* ─── Highlight marker on card hover ─── */
  useEffect(() => {
    markersMapRef.current.forEach((mark, id) => {
      const car = visibleCars.find((c) => c.id === id);
      if (!car) return;
      if (id === hoveredCarId || id === selectedCar?.id) {
        mark.options.set("iconColor", "#FF6B35");
      } else {
        mark.options.set("iconColor", CLASS_COLORS[car.carClass]);
      }
    });
  }, [hoveredCarId, selectedCar, visibleCars]);

  /* ─── Drop map markers whenever visibleCars changes ─── */
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ymaps = ymapsRef.current as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapInstanceRef.current as any;

    // Clear old markers
    markersRef.current.forEach((m) => map.geoObjects.remove(m));
    markersRef.current = [];
    markersMapRef.current.clear();

    // User location marker — Yandex-style pin (green circle + white dot + stem)
    if (userLocation) {
      const userLayout = ymaps.templateLayoutFactory.createClass(
        '<div style="display:flex;flex-direction:column;align-items:center;width:52px;">' +
          '<div style="' +
          "width:52px;height:52px;border-radius:50%;" +
          "background:#2D8A1E;" +
          "border:4px solid #fff;" +
          "box-shadow:0 6px 20px rgba(45,138,30,0.55);" +
          "display:flex;align-items:center;justify-content:center;" +
          '">' +
          '<div style="width:16px;height:16px;border-radius:50%;background:#fff;"></div>' +
          "</div>" +
          '<div style="width:4px;height:18px;background:#2D8A1E;margin-top:-3px;border-radius:0 0 2px 2px;"></div>' +
          '<div style="width:10px;height:6px;border-radius:50%;background:rgba(0,0,0,0.25);margin-top:1px;"></div>' +
          "</div>",
      );
      const userMark = new ymaps.Placemark(
        [userLocation.lat, userLocation.lon],
        { hintContent: "You are here" },
        {
          iconLayout: userLayout,
          iconShape: { type: "Circle", coordinates: [26, 26], radius: 26 },
          iconOffset: [-26, -76],
        },
      );
      map.geoObjects.add(userMark);
      markersRef.current.push(userMark);
    }

    // Car markers — built-in circle preset, one per car, registered in markersMapRef for hover sync
    visibleCars.forEach((car) => {
      const color = CLASS_COLORS[car.carClass];
      const mark = new ymaps.Placemark(
        [car.latitude, car.longitude],
        {
          hintContent: `${car.model} · ${car.tariff?.perMinDriving?.toFixed(2) ?? "?"} TJS/min`,
        },
        {
          preset: "islands#circleIcon",
          iconColor: color,
        },
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mark.events.add("click", (_e: any) => {
        if (!isAuthenticated) {
          setGuestModal(true);
          return;
        }
        const map = mapInstanceRef.current as any;
        const projection = map.options.get("projection");
        const globalPx = projection.toGlobalPixels(
          [car.latitude, car.longitude],
          map.getZoom(),
        );
        const pagePx = map.converter.globalToPage(globalPx);
        const mapRect = mapRef.current?.getBoundingClientRect();
        setPopupPos({
          x: (mapRect?.left ?? 0) + pagePx[0],
          y: (mapRect?.top ?? 0) + pagePx[1],
        });
        dispatch(setSelectedCar(car.id));
      });
      map.geoObjects.add(mark);
      markersRef.current.push(mark);
      markersMapRef.current.set(car.id, mark);
    });
  }, [visibleCars, userLocation, mapReady, isAuthenticated, dispatch]);

  /* ─── Show only selected car marker; restore all when deselected ─── */
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    markersMapRef.current.forEach((marker, carId) => {
      marker.options.set("visible", !selectedCar || carId === selectedCar.id);
    });
  }, [selectedCar, mapReady]);

  const formatDist = (m: number) =>
    m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-100">
      {/* ─── Full-screen map ─── */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {/* ─── Left sidebar (Yandex style) ─── */}
      <div className="absolute left-0 top-0 bottom-0 z-10 w-[340px] flex flex-col bg-white shadow-2xl">
        {/* Header: back + logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 shrink-0">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M12 2L8 8H4l8 14 8-14h-4L12 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">
              Rent<span className="text-primary">Drive</span>
            </span>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {loading ? "…" : `${visibleCars.length} nearby`}
            </span>
          </div>
        </div>

        {/* Class filters */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex gap-1.5">
            {(
              [null, "ECONOMY", "COMFORT", "CROSSOVER"] as (CarClass | null)[]
            ).map((cls) => (
              <button
                key={cls ?? "ALL"}
                onClick={() => dispatch(setClassFilter(cls))}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                  classFilter === cls
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cls ? cls.slice(0, 3) : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Car list — scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-[76px] bg-gray-100 rounded-2xl animate-pulse shrink-0"
              />
            ))
          ) : visibleCars.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 text-gray-400 text-sm">
              No cars available nearby right now.
            </div>
          ) : (
            visibleCars.map((car) => (
              <button
                key={car.id}
                onClick={() => {
                  if (!isAuthenticated) {
                    setGuestModal(true);
                    return;
                  }
                  dispatch(
                    setSelectedCar(selectedCar?.id === car.id ? null : car.id),
                  );
                }}
                onMouseEnter={() => setHoveredCarId(car.id)}
                onMouseLeave={() => setHoveredCarId(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left shrink-0 ${
                  selectedCar?.id === car.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : hoveredCarId === car.id
                      ? "border-orange-300 bg-orange-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                {/* Car image */}
                <div className="w-[60px] h-[52px] rounded-xl bg-gray-100 overflow-hidden relative shrink-0">
                  {car.imageUrl ? (
                    <Image
                      src={car.imageUrl}
                      alt={car.model}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1V5h4l3 5v5h-1m-1 1H9"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {car.model}
                    </p>
                    <span
                      className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white uppercase shrink-0"
                      style={{ background: CLASS_COLORS[car.carClass] }}
                    >
                      {car.carClass.slice(0, 3)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {formatDist(car.distanceMeters)} away
                  </p>
                  {/* mini fuel bar */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${car.fuelLevel > 50 ? "bg-green-400" : car.fuelLevel > 20 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${car.fuelLevel}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {car.fuelLevel}%
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0 ml-1">
                  <p className="text-sm font-black text-primary leading-none">
                    {car.tariff?.perMinDriving?.toFixed(2) ?? "—"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">TJS/min</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── Right controls: zoom pill + location button (Yandex style) ─── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-3">
        {/* Zoom pill */}
        <div className="bg-white rounded-[28px] shadow-lg overflow-hidden flex flex-col">
          <button
            onClick={() => handleZoom(1)}
            className="w-14 h-14 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700 text-2xl font-light select-none"
          >
            +
          </button>
          <div className="h-px bg-gray-200 mx-3" />
          <button
            onClick={() => handleZoom(-1)}
            className="w-14 h-14 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700 text-2xl font-light select-none"
          >
            −
          </button>
        </div>

        {/* Location button row */}
        <div className="flex items-center gap-3">
          {locationPermission === "denied" && (
            <div className="bg-white text-gray-800 text-sm font-medium px-4 py-3 rounded-full shadow-lg whitespace-nowrap animate-in slide-in-from-right-4 duration-300">
              No access to geolocation
            </div>
          )}
          <button
            onClick={handleRequestLocation}
            title="My location"
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 bg-white ${
              locationPermission === "granted"
                ? "text-primary"
                : "text-gray-400"
            }`}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7-7-3.13 7-7 7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Zone warning toast ─── */}
      {zoneWarning && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-top-4 fade-in duration-300 max-w-sm w-max">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-xl text-sm font-semibold whitespace-nowrap ${
              zoneWarning.startsWith("⚠️")
                ? "bg-red-500 text-white"
                : zoneWarning.startsWith("✓")
                  ? "bg-primary text-white"
                  : "bg-amber-400 text-amber-900"
            }`}
          >
            {zoneWarning}
          </div>
        </div>
      )}

      {/* ─── Guest modal ─── */}
      {guestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
              <svg
                className="w-7 h-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2L8 8H4l8 14 8-14h-4L12 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Join the club
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Create a free account to reserve cars, track rides, and unlock VIP
              perks. Takes 30 seconds.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/client/auth/register"
                onClick={() => setGuestModal(false)}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-2xl text-center text-sm transition-colors shadow-md shadow-primary/20"
              >
                Create Account — It&apos;s Free
              </Link>
              <Link
                href="/client/auth/login"
                onClick={() => setGuestModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-center text-sm transition-colors"
              >
                I already have an account
              </Link>
              <button
                onClick={() => setGuestModal(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
              >
                Just browsing for now
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Floating car popup above marker ─── */}
      {selectedCar && popupPos && (
        <div
          className="absolute z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: Math.max(196, Math.min(popupPos.x, window.innerWidth - 196)),
            top: popupPos.y,
            transform: "translate(-50%, calc(-100% - 16px))",
          }}
        >
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45" />

          <div className="flex items-start gap-3 p-4">
            <div className="w-16 h-14 rounded-xl bg-gray-100 overflow-hidden relative shrink-0">
              {selectedCar.imageUrl ? (
                <Image
                  src={selectedCar.imageUrl}
                  alt={selectedCar.model}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1V5h4l3 5v5h-1m-1 1H9"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-gray-900 truncate">
                  {selectedCar.model}
                </h3>
                <span
                  className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white uppercase shrink-0"
                  style={{ background: CLASS_COLORS[selectedCar.carClass] }}
                >
                  {CLASS_LABELS[selectedCar.carClass]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDist(selectedCar.distanceMeters)} away
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedCar.fuelLevel > 50 ? "bg-green-400" : selectedCar.fuelLevel > 20 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${selectedCar.fuelLevel}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {selectedCar.fuelLevel}%
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                dispatch(setSelectedCar(null));
                setPopupPos(null);
              }}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors"
            >
              <svg
                className="w-3 h-3 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {selectedCar.tariff &&
            (() => {
              const t = selectedCar.tariff;
              const pkgs: {
                key: "flex" | "3h" | "24h";
                label: string;
                value: string;
                unit: string;
              }[] = [
                {
                  key: "flex",
                  label: "Per min",
                  value: t.perMinDriving.toFixed(2),
                  unit: "TJS/min",
                },
                {
                  key: "3h",
                  label: "3 hours",
                  value: String(t.package3h),
                  unit: "TJS",
                },
                {
                  key: "24h",
                  label: "24 hours",
                  value: String(t.package24h),
                  unit: "TJS",
                },
              ];
              return (
                <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                  {pkgs.map((p) => {
                    const active = selectedPkg === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => setSelectedPkg(p.key)}
                        className={`rounded-xl p-2 text-center transition-all border ${
                          active
                            ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                            : "bg-gray-50 border-transparent hover:bg-gray-100"
                        }`}
                      >
                        <p
                          className={`text-[9px] uppercase font-bold ${active ? "text-primary" : "text-gray-400"}`}
                        >
                          {p.label}
                        </p>
                        <p
                          className={`text-xs font-black mt-0.5 ${active ? "text-primary" : "text-gray-900"}`}
                        >
                          {p.value}
                        </p>
                        <p
                          className={`text-[8px] ${active ? "text-primary/70" : "text-gray-400"}`}
                        >
                          {p.unit}
                        </p>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

          {selectedCar.features.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1">
              {selectedCar.features.slice(0, 4).map((f) => (
                <span
                  key={f}
                  className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                >
                  {f}
                </span>
              ))}
            </div>
          )}

          <div className="px-4 pb-4">
            <Link
              href={`/client/payment/${selectedCar.id}?pkg=${selectedPkg}`}
              className="block w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-2xl text-center text-sm transition-colors shadow-md shadow-primary/20"
            >
              Reserve ·{" "}
              {selectedPkg === "flex"
                ? "Flex"
                : selectedPkg === "3h"
                  ? "3H"
                  : "24H"}
            </Link>
          </div>
        </div>
      )}

      {/* ─── Active trip floating card ─── */}
      <ActiveTripOverlay
        userLat={userLocation?.lat ?? null}
        userLon={userLocation?.lon ?? null}
      />

      {/* ─── Trip summary modal ─── */}
      <TripSummaryModal />

      {/* ─── Hide Yandex Copyrights ─── */}
      <style jsx global>{`
        [class*="ymaps-2-1-"][class*="-copyrights-pane"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
