"use client";

import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const CARS = [
  { src: "http://localhost:3001/uploads/cars/hyundai-accent.avif", label: "Hyundai Accent", category: "ECONOMY"   },
  { src: "http://localhost:3001/uploads/cars/kia-rio.jpeg",        label: "Kia Rio X",      category: "COMFORT"   },
  { src: "http://localhost:3001/uploads/cars/nissan-qashqai.webp", label: "Nissan Qashqai", category: "CROSSOVER" },
];

const ROW_TOP    = [...CARS, ...CARS, ...CARS, ...CARS];
const ROW_BOTTOM = [...[...CARS].reverse(), ...[...CARS].reverse(), ...[...CARS].reverse(), ...[...CARS].reverse()];

function MarqueeCard({ src, label, category }: { src: string; label: string; category: string }) {
  return (
    <div className="shrink-0 w-72 flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={src}
          alt={label}
          fill
          className="object-cover"
          unoptimized
        />
        <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
          {category}
        </span>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
        <p className="absolute bottom-2 left-3 text-white text-sm font-bold">{label}</p>
      </div>
      <div className="p-3">
        <Link
          href={`/client/fleet?class=${category}`}
          className="block w-full bg-zinc-800 hover:bg-primary text-white text-xs font-bold py-3 rounded-xl text-center transition-colors"
        >
          Reserve Now
        </Link>
      </div>
    </div>
  );
}

function MarqueeRow({ items, direction }: { items: typeof ROW_TOP; direction: "left" | "right" }) {
  return (
    <div className="overflow-hidden w-full">
      <div className={`flex gap-4 w-max ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}>
        {items.map((car, i) => <MarqueeCard key={i} {...car} />)}
      </div>
    </div>
  );
}

export function FleetSection() {
  const t = useTranslations("landing.fleet");

  return (
    <section id="fleet" className="py-24 overflow-hidden" style={{ background: "radial-gradient(ellipse at 65% 40%, #1a3a6e 0%, #0f2147 40%, #070d1f 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          className="flex items-end justify-between mb-14"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">{t("subtitle")}</p>
            <h2 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-5">{t("title")}</h2>
            <p className="text-zinc-500 text-base leading-relaxed">{t("description")}</p>
          </div>
          <Link
            href="/client/fleet"
            className="shrink-0 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold px-6 py-3.5 rounded-2xl transition-colors shadow-lg shadow-primary/20"
          >
            {t("viewAll")}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>

      </div>

      {/* ── Marquee rows (full width, no max-w) ── */}
      <div className="flex flex-col gap-4 select-none">
        <MarqueeRow items={ROW_TOP}    direction="right" />
        <MarqueeRow items={ROW_BOTTOM} direction="left"  />
      </div>

    </section>
  );
}
