"use client";

import { store } from "@/src/store";
import { Provider } from "react-redux";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/ThemedToaster";
import { UserInitializer } from "./auth/UserInitializer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <UserInitializer />
        {children}
        <Toaster position="top-center" />
      </ThemeProvider>
    </Provider>
  );
}
