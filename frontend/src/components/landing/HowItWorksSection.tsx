"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, useInView } from "framer-motion";

/* ── Single step text block ── */
interface StepBlockProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onEnter: () => void;
}

function StepBlock({ number, title, description, icon, isActive, onEnter }: StepBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  const inView = useInView(ref, { margin: "-40% 0px -40% 0px" });
  useEffect(() => {
    if (inView) onEnter();
  }, [inView]);

  return (
    <div
      ref={ref}
      className={`min-h-screen flex items-center border-t border-white/8 transition-opacity duration-500 ${
        isActive ? "opacity-100" : "opacity-30"
      }`}
    >
      <div className="flex items-start gap-5 py-16">
        {/* Number */}
        <span
          className={`text-[5rem] lg:text-[7rem] font-black leading-none select-none shrink-0 transition-colors duration-500 ${
            isActive ? "text-primary/50" : "text-white/8"
          }`}
        >
          {number}
        </span>

        {/* Text + icon */}
        <div className="pt-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-500 ${
                isActive
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                  : "border-white/10 text-zinc-600"
              }`}
            >
              {icon}
            </div>
            <h3 className="text-xl lg:text-2xl font-black text-white">{title}</h3>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Sticky video panel ── */
interface VideoPanelProps {
  active: number;
}

const VIDEO_SRCS = [
  "/register.mp4",
  "/mp_ (1).mp4",
  "/animationmp_.mp4",
];

function VideoPanel({ active }: VideoPanelProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-900">
      {VIDEO_SRCS.map((src, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          animate={{ opacity: active === i ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        </motion.div>
      ))}

      {/* Step indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {VIDEO_SRCS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              active === i ? "w-6 bg-primary" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main section ── */
export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: "01",
      title: t("steps.1.title"),
      description: t("steps.1.desc"),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      number: "02",
      title: t("steps.2.title"),
      description: t("steps.2.desc"),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      number: "03",
      title: t("steps.3.title"),
      description: t("steps.3.desc"),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="border-t border-white/5" style={{ background: "radial-gradient(ellipse at 65% 40%, #1a3a6e 0%, #0f2147 40%, #070d1f 100%)" }}>

      {/* Section header */}
      <div className="max-w-7xl mx-auto px-8 sm:px-14 lg:px-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-16 border-b border-white/8">
          <div>
            <p className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
              {t("subtitle")}
            </p>
            <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-black text-white leading-[0.95] tracking-tight">
              {t("title")}
            </h2>
          </div>
          <p className="text-zinc-500 text-xs max-w-[200px] leading-relaxed sm:text-right">
            {t("description")}
          </p>
        </div>
      </div>

      {/* Two-column layout — full width, no max-w constraint */}
      <div className="flex flex-col lg:flex-row">

        {/* LEFT — scrolling text, w-1/2 */}
        <div className="w-full lg:w-1/2 px-8 sm:px-14 lg:px-20">
          {steps.map((step, i) => (
            <StepBlock
              key={step.number}
              {...step}
              isActive={activeStep === i}
              onEnter={() => setActiveStep(i)}
            />
          ))}
        </div>

        {/* RIGHT — sticky video, flush to edge with rounded left corners */}
        <div className="hidden lg:block w-1/2">
          <div className="sticky top-0 h-screen flex items-center pr-0 pl-8 py-8">
            <div className="relative w-full h-full rounded-l-3xl overflow-hidden">
              <VideoPanel active={activeStep} />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
