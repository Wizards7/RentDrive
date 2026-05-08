"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { Link } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/src/hooks/redux";
import { selectIsAuthenticated } from "@/src/store/slices/authSlice";
import AOS from "aos";
import "aos/dist/aos.css";


export function HeroSection() {
  const t = useTranslations("landing.hero");
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [appModal, setAppModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });


  /* Text: fade + blur out */
  const textOpacity  = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const textBlurPx   = useTransform(scrollYProgress, [0, 0.35], [0, 12]);
  const textFilter   = useMotionTemplate`blur(${textBlurPx}px)`;
  const textPointer  = useTransform(scrollYProgress, (v) =>
    v > 0.25 ? "none" : "auto"
  );

  /* Spline: slides from right → center */
  const splineX = useTransform(scrollYProgress, [0, 0.6], ["25vw", "0vw"]);

  useEffect(() => {
    setMounted(true);
    AOS.init({ duration: 900, once: true, easing: "ease-out-cubic" });
  }, []);

  return (
    <div ref={containerRef} className="relative h-[300vh]">

      {/* ── Sticky stage ── */}
      <div className="sticky top-0 w-full h-screen overflow-hidden pt-16" style={{ background: "radial-gradient(ellipse at 65% 40%, #1a3a6e 0%, #0f2147 40%, #070d1f 100%)" }}>

        {/* ── 3D Spline layer (background, slides to center) ── */}
        <Script
          src="https://unpkg.com/@splinetool/viewer@1.12.90/build/spline-viewer.js"
          type="module"
          strategy="afterInteractive"
        />
        <motion.div
          style={{ x: splineX }}
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto"
        >
          {/* @ts-expect-error spline-viewer is a custom element */}
          <spline-viewer
            url="https://prod.spline.design/Ta1cue-TWaoiVxB0/scene.splinecode"
            style={{ width: "100%", height: "100%" }}
          />
        </motion.div>

        {/* ── Text layer (foreground, fades out) ── */}
        <motion.div
          style={{
            opacity: textOpacity,
            filter: textFilter,
            pointerEvents: textPointer,
          }}
          className="absolute top-0 left-0 w-full md:w-1/2 h-full z-20 flex flex-col justify-center pl-8 md:pl-16 lg:pl-24"
        >
          {/* Badge */}
          <div className="flex items-center gap-2 mb-4" data-aos="fade-down">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase">{t("badge")}</span>
          </div>

          {/* Headline */}
          <h1
            className="leading-[1.0] tracking-tight mb-4"
            style={{ fontFamily: "'Instrument Serif', serif" }}
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <span className="text-[clamp(2rem,3.8vw,3.5rem)] text-white block drop-shadow-lg">
              {t("title1")}
            </span>
            <span className="text-[clamp(2rem,3.8vw,3.5rem)] text-white drop-shadow-lg">
              {t("title2")}{" "}
            </span>
            <span
              className="text-[clamp(2rem,3.8vw,3.5rem)] italic"
              style={{
                background: "linear-gradient(135deg,#1a5c10 0%,#2D8A1E 50%,#1a5c10 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 12px rgba(45,138,30,0.4))",
              }}
            >
              {t("titleHighlight")}
            </span>
          </h1>

          {/* Description */}
          <p
            className="text-white/80 text-sm leading-relaxed mb-6 max-w-sm"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {t("description")}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2.5 mb-6" data-aos="fade-up" data-aos-delay="300">
            <Link
              href={mounted && isAuthenticated ? "/client/fleet" : "/client/auth/register"}
              className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2.5 rounded-full text-sm tracking-wide transition-all shadow-lg shadow-primary/30"
            >
              {t("startDriving")}
            </Link>
            <a
              href="#how-it-works"
              className="border border-white/40 hover:border-white/70 text-white font-bold px-6 py-2.5 rounded-full text-sm tracking-wide transition-all hover:bg-white/10 backdrop-blur-sm"
            >
              {t("howItWorks")}
            </a>
          </div>

          {/* App badges */}
          <div className="flex gap-2.5 flex-wrap mb-8" data-aos="fade-up" data-aos-delay="400">
            {[
              {
                icon: (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                ),
                label: t("downloadApp"),
                name: "App Store",
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.18 23.76c.3.17.64.22.99.14l12.76-7.37-2.84-2.84-10.91 10.07zM.54 1.52C.2 1.86 0 2.4 0 3.09v17.82c0 .69.2 1.23.55 1.57l.08.08 9.98-9.98v-.23L.62 1.44l-.08.08zM20.96 10.8l-2.68-1.55-3.18 3.18 3.18 3.18 2.69-1.55c.77-.44.77-1.16-.01-1.6v-.66zM4.17.24L16.93 7.6l-2.84 2.84L3.18.37a1.17 1.17 0 011-.13z" />
                  </svg>
                ),
                label: t("getApp"),
                name: "Google Play",
              },
            ].map((app) => (
              <button
                key={app.name}
                onClick={() => setAppModal(true)}
                className="flex items-center gap-3 border border-white/20 hover:border-white/40 bg-black/20 hover:bg-black/30 backdrop-blur-sm px-4 py-2.5 rounded-xl transition-all"
              >
                {app.icon}
                <div className="text-left">
                  <p className="text-[10px] text-white/50 leading-none">{app.label}</p>
                  <p className="text-sm font-bold text-white">{app.name}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-4 border-t border-white/20" data-aos="fade-up" data-aos-delay="500">
            {[
              { value: "500+", label: t("stats.cars") },
              { value: "50K+", label: t("stats.users") },
              { value: "4.9★", label: t("stats.rating") },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-black text-white">{stat.value}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

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
    </div>
  );
}
