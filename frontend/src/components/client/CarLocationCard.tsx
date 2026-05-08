"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/src/i18n/navigation";

interface CarLocationCardProps {
  carId: number;
  latitude: number;
  longitude: number;
  address?: string;
  carLabel?: string;
}

export function CarLocationCard({
  carId,
  latitude,
  longitude,
  address,
  carLabel,
}: CarLocationCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [zoom, setZoom] = useState(15);

  const yandexMapSrc = `https://maps.yandex.ru/?ll=${longitude},${latitude}&z=${zoom}&l=map&pt=${longitude},${latitude},pm2gnl`;

  const directionsHref = `https://yandex.ru/maps/?rtext=~${latitude},${longitude}&rtt=auto`;

  function handleZoomIn() {
    setZoom((z) => Math.min(z + 1, 21));
  }

  function handleZoomOut() {
    setZoom((z) => Math.max(z - 1, 1));
  }

  return (
    <div className="rounded-3xl overflow-hidden bg-[#1c1c1e] border border-white/8 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Car Location
          </p>
          <h3 className="text-white font-bold text-base mt-0.5">
            {carLabel ?? "Current Position"}
          </h3>
          {address && (
            <p className="text-zinc-500 text-xs mt-0.5 leading-snug line-clamp-1">
              {address}
            </p>
          )}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[10px] text-green-500 font-bold uppercase tracking-wide">
            Live
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="relative mx-3 rounded-2xl overflow-hidden" style={{ height: 220 }}>
        <iframe
          ref={iframeRef}
          key={zoom}
          src={yandexMapSrc}
          title="Car location"
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
        />

        {/* Overlay: center car dot */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Pulse ring */}
            <span className="absolute -inset-4 rounded-full bg-green-500/20 animate-ping" />
            {/* Dot */}
            <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-lg shadow-green-500/50 z-10 relative" />
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center text-lg font-bold hover:bg-black/80 transition-colors"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center text-lg font-bold hover:bg-black/80 transition-colors"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>

        {/* Directions button */}
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-white text-gray-900 text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-gray-100 transition-colors"
        >
          {/* Pin icon */}
          <svg className="w-3.5 h-3.5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          Directions
        </a>

        {/* Gradient edges for depth */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
      </div>

      {/* Reserve button */}
      <div className="px-3 pt-3 pb-4">
        <Link
          href={`/client/rentals?carId=${carId}`}
          className="block w-full bg-primary hover:bg-primary-hover text-white text-sm font-bold py-3.5 rounded-2xl text-center transition-colors shadow-lg shadow-primary/20"
        >
          Reserve Now
        </Link>
      </div>
    </div>
  );
}
