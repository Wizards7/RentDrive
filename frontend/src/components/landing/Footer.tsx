"use client";

import { useState, useEffect } from "react";
import { Link } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/src/hooks/redux";
import { selectIsAuthenticated } from "@/src/store/slices/authSlice";

export function Footer() {
  const t = useTranslations("landing.footer");
  const tNav = useTranslations("landing.nav");
  const [appModal, setAppModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = {
    Service: [
      { label: tNav("howItWorks"), href: "#how-it-works" },
      { label: tNav("fleet"),      href: "#fleet" },
      { label: tNav("pricing"),    href: "#pricing" },
      { label: tNav("safety"),     href: "#safety" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Use",   href: "#" },
      { label: "Cookie Policy",  href: "#" },
    ],
    Support: [
      { label: "FAQ",               href: "#" },
      { label: tNav("support"),     href: "#support" },
      { label: "Refueling Guide",   href: "#" },
      { label: "Parking Zones",     href: "#" },
    ],
  };

  return (
    <footer className="border-t border-white/10" style={{ background: "linear-gradient(180deg, #040810 0%, #020408 100%)" }}>

      {/* ── Big CTA strip ── */}
      <div className="max-w-7xl mx-auto px-8 sm:px-14 lg:px-20 py-24 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10 border-b border-white/5">
        <h3 className="text-[clamp(2.5rem,6vw,5rem)] font-black text-white leading-[1] tracking-tight max-w-lg">
          {t("ready")}
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
          <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">{t("join")}</p>
          <Link
            href={mounted && isAuthenticated ? "/client/fleet" : "/client/auth/register"}
            className="bg-primary hover:bg-primary-hover text-white font-bold px-8 py-4 rounded-full text-sm tracking-wide transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 whitespace-nowrap"
          >
            {t("getStarted")}
          </Link>
        </div>
      </div>

      {/* ── Links ── */}
      <div className="max-w-7xl mx-auto px-8 sm:px-14 lg:px-20 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand column */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M12 2L8 8H4l8 14 8-14h-4L12 2z" />
                </svg>
              </div>
              <span className="font-black text-white text-lg">Rent<span className="text-primary">Drive</span></span>
            </div>
            <p className="text-zinc-600 text-sm leading-relaxed">{t("desc")}</p>

            {/* App store buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setAppModal(true)}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 rounded-xl px-4 py-2.5 transition-all text-left w-full"
              >
                <svg className="w-5 h-5 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <p className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold leading-none">Download on the</p>
                  <p className="text-white text-sm font-black leading-tight">App Store</p>
                </div>
              </button>
              <button
                onClick={() => setAppModal(true)}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 rounded-xl px-4 py-2.5 transition-all text-left w-full"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M3.18 23.76c.3.17.64.24.99.19l12.49-7.22-2.79-2.79-10.69 9.82z" fill="#EA4335"/>
                  <path d="M20.93 10.03L17.9 8.26 14.77 11.4l3.13 3.13 3.04-1.76c.87-.5.87-1.74-.01-2.74z" fill="#FBBC05"/>
                  <path d="M3.17.24C2.87.44 2.68.79 2.68 1.23v21.54c0 .44.19.79.49.99l.12.07L15.41 12 3.29.17l-.12.07z" fill="#4285F4"/>
                  <path d="M4.17 23.95l11.24-6.5-2.79-2.79-10.69 9.82c.38.22.83.25 1.24-.53z" fill="#34A853"/>
                </svg>
                <div>
                  <p className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold leading-none">Get it on</p>
                  <p className="text-white text-sm font-black leading-tight">Google Play</p>
                </div>
              </button>
            </div>

            <div className="flex gap-2">
              {["T", "I", "F"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-8 h-8 border border-white/8 hover:border-primary/40 rounded-lg flex items-center justify-center text-zinc-600 hover:text-primary transition-colors text-xs font-black"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title} className="flex flex-col gap-4">
              <h4 className="text-white font-bold text-xs tracking-[0.15em] uppercase">{title}</h4>
              {items.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-zinc-600 hover:text-white text-sm transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-16 pt-8 border-t border-white/5">
          <p className="text-zinc-700 text-xs">{t("rights")}</p>
          <p className="text-zinc-700 text-xs">{t("madeWith")}</p>
        </div>
      </div>
      {/* ── Mobile app coming soon modal ── */}
      {appModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setAppModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center gap-5 border border-white/10"
            style={{ background: "linear-gradient(145deg, #0f2147 0%, #070d1f 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setAppModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Phone icon */}
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            {/* Badge */}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              Coming Soon
            </span>

            <div>
              <h3 className="text-2xl font-black text-white leading-tight">Mobile App<br />in Development</h3>
              <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
                We&apos;re building the RentDrive mobile app for iOS and Android. Reserve cars, track your trip, and unlock your car — all from your phone.
              </p>
            </div>

            {/* Platforms */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 bg-white/5 border border-white/8 rounded-2xl py-3 flex flex-col items-center gap-1">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-xs text-zinc-400 font-bold">iOS</span>
              </div>
              <div className="flex-1 bg-white/5 border border-white/8 rounded-2xl py-3 flex flex-col items-center gap-1">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M3.18 23.76c.3.17.64.24.99.19l12.49-7.22-2.79-2.79-10.69 9.82z" fill="#EA4335"/>
                  <path d="M20.93 10.03L17.9 8.26 14.77 11.4l3.13 3.13 3.04-1.76c.87-.5.87-1.74-.01-2.74z" fill="#FBBC05"/>
                  <path d="M3.17.24C2.87.44 2.68.79 2.68 1.23v21.54c0 .44.19.79.49.99l.12.07L15.41 12 3.29.17l-.12.07z" fill="#4285F4"/>
                  <path d="M4.17 23.95l11.24-6.5-2.79-2.79-10.69 9.82c.38.22.83.25 1.24-.53z" fill="#34A853"/>
                </svg>
                <span className="text-xs text-zinc-400 font-bold">Android</span>
              </div>
            </div>

            <button
              onClick={() => setAppModal(false)}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-2xl text-sm transition-colors"
            >
              Got it, notify me when ready
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
