"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedHeadingProps {
  text: string;
  delay?: number;
  charDelay?: number;
  className?: string;
}

export function AnimatedHeading({ text, delay = 0, charDelay = 30, className = "" }: AnimatedHeadingProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const lines = text.split("\n");

  return (
    <div className={`overflow-hidden ${className}`}>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} className="flex flex-wrap">
          {line.split("").map((char, charIndex) => (
            <span
              key={charIndex}
              className={`inline-block transition-all duration-500 ease-out ${
                visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-[18px]"
              }`}
              style={{ transitionDelay: `${lineIndex * line.length * charDelay + charIndex * charDelay}ms` }}
            >
              {char === " " ? " " : char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className = "" }: FadeInProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity duration-700 ease-in-out ${visible ? "opacity-100" : "opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

interface RevealOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function RevealOnScroll({ children, delay = 0, className = "" }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}
