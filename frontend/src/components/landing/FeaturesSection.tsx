"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const ICONS = {
  insurance: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  parking: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
    </svg>
  ),
  fuel: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  ),
  support: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  safety: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  ),
  unlock: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  ),
};

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  const features = [
    { key: "insurance", icon: ICONS.insurance, accent: "from-primary/20 to-primary/5",   ring: "ring-primary/20"   },
    { key: "parking",   icon: ICONS.parking,   accent: "from-blue-500/20 to-blue-500/5", ring: "ring-blue-500/20"  },
    { key: "fuel",      icon: ICONS.fuel,       accent: "from-amber-500/20 to-amber-500/5", ring: "ring-amber-500/20" },
    { key: "support",   icon: ICONS.support,   accent: "from-violet-500/20 to-violet-500/5", ring: "ring-violet-500/20" },
    { key: "safety",    icon: ICONS.safety,    accent: "from-rose-500/20 to-rose-500/5", ring: "ring-rose-500/20"  },
    { key: "unlock",    icon: ICONS.unlock,    accent: "from-cyan-500/20 to-cyan-500/5", ring: "ring-cyan-500/20"  },
  ];

  return (
    <section id="safety" className="py-28 border-t border-white/5" style={{ background: "radial-gradient(ellipse at 65% 40%, #1a3a6e 0%, #0f2147 40%, #070d1f 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-20">

        {/* ── Header ── */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div>
            <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">{t("subtitle")}</p>
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black text-white leading-[1] tracking-tight">
              {t("title")}
            </h2>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs sm:text-right">
            {t("description")}
          </p>
        </motion.div>

        {/* ── Cards ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
              className="group relative bg-zinc-900 border border-white/5 rounded-3xl p-7 overflow-hidden hover:border-white/10 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Glow blob */}
              <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-radial ${f.accent} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Number */}
              <span className="absolute top-5 right-6 text-5xl font-black text-white/4 select-none leading-none">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Icon */}
              <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${f.accent} ring-1 ${f.ring} flex items-center justify-center text-white mb-6`}>
                {f.icon}
              </div>

              {/* Text */}
              <h3 className="relative text-lg font-black text-white mb-3 leading-tight">
                {t(`items.${f.key}.title`)}
              </h3>
              <p className="relative text-zinc-500 text-sm leading-relaxed">
                {t(`items.${f.key}.desc`)}
              </p>

              {/* Arrow */}
              <div className="relative mt-6 flex items-center gap-1.5 text-xs font-bold text-zinc-600 group-hover:text-primary transition-colors duration-300">
                <span>Learn more</span>
                <svg className="w-3.5 h-3.5 -translate-x-1 group-hover:translate-x-0 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
