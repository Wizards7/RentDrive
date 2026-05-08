"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { ThemeToggle } from "../theme-toggle";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/src/i18n/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

function getAdminToken() {
  return (
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("admin_token="))
      ?.split("=")[1] ?? ""
  );
}

const typeIcon: Record<string, string> = {
  USER_LOGIN: "🟢",
  USER_BLOCKED: "🚫",
  VIP_STATUS: "⭐",
  USER_DELETED: "🗑️",
  LOW_FUEL: "⛽",
};

export function AdminTopBar() {
  const t = useTranslations("admin.topbar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const fetchNotifications = () => {
    const token = getAdminToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open && unread > 0) {
      const token = getAdminToken();
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/notifications/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      });
    }
  };

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-6 bg-white dark:bg-gray-900 shrink-0">
      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <div className="relative">
          <select
            value={locale}
            onChange={handleLanguageChange}
            disabled={isPending}
            className="appearance-none h-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 pl-2.5 pr-6 cursor-pointer disabled:opacity-50 focus:outline-none"
          >
            <option value="en">EN</option>
            <option value="ru">RU</option>
            <option value="tj">TJ</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-gray-400 dark:text-gray-500">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

        {/* Notifications bell */}
        <div className="relative" ref={ref}>
          <button
            onClick={handleOpen}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{t("notifications")}</p>
                <span className="text-xs text-gray-500">
                  {t("total", { count: notifications.length })}
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    {t("noNotifications")}
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 last:border-b-0 ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-base mt-0.5">
                          {typeIcon[n.type] ?? "🔔"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {n.body}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin profile link */}
        <Link
          href="/admin/profile"
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white hover:bg-primary-hover transition-colors"
          title={t("profile")}
        >
          A
        </Link>
      </div>
    </header>
  );
}
