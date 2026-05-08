"use client";

import { Toaster as SileoToaster, SileoPosition } from "sileo";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemedToasterProps {
  position?: SileoPosition;
}

export function Toaster({ position = "top-center" }: ThemedToasterProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Explicitly define styles for light and dark modes to ensure correct colors
  const isDark = resolvedTheme === "dark";

  return (
    <SileoToaster
      position={position}
      theme={isDark ? "dark" : "light"}
      options={{
        styles: {
          title: isDark ? "color: white;" : "color: black;",
          description: isDark
            ? "color: rgba(0,0,0,0.6);"
            : "color: rgba(255,255,255,0.6);",
        },
        fill: isDark ? "#09090b" : "#ffffff", // zinc-950 for dark, white for light
      }}
    />
  );
}
