"use client";

import { useState, useTransition, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/src/i18n/navigation";
import { useAppSelector, useAppDispatch } from "@/src/hooks/redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  logout,
} from "@/src/store/slices/authSlice";
import { sileo } from "sileo";

export function Navbar() {
  const t = useTranslations("landing.nav");
  const tAuth = useTranslations("auth");
  const tm = useTranslations("admin.logoutModal");

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  const confirmLogout = () => {
    dispatch(logout());
    setProfileOpen(false);
    setShowLogoutModal(false);
    sileo.error({
      title: tAuth("success.logout"),
      description: tAuth("success.logoutSub"),
    });
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
    setProfileOpen(false);
  };

  const navItems = [
    { label: t("howItWorks"), href: "#how-it-works" },
    { label: t("fleet"), href: "#fleet" },
    { label: t("pricing"), href: "#pricing" },
    { label: t("safety"), href: "#safety" },
  ];

  const openSupport = () =>
    window.dispatchEvent(new Event("open-support-chat"));

  return (
    <>
      <nav className="liquid-glass fixed top-0 left-0 right-0 z-[9990]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M12 2L8 8H4l8 14 8-14h-4L12 2z" />
                </svg>
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Rent<span className="text-primary">Drive</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="relative text-sm text-white/60 hover:text-white font-medium transition-colors pb-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={openSupport}
                className="relative text-sm text-white/60 hover:text-white font-medium transition-colors pb-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              >
                {t("support")}
              </button>
            </div>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 border-r border-white/10 pr-3 mr-1">
                <div className="relative">
                  <select
                    value={locale}
                    onChange={handleLanguageChange}
                    disabled={isPending}
                    className="appearance-none h-9 rounded-full border border-white/10 bg-white/5 text-white/80 text-sm font-semibold transition-colors hover:bg-white/10 pl-3 pr-7 cursor-pointer disabled:opacity-50 focus:outline-none"
                  >
                    <option value="en">EN</option>
                    <option value="ru">RU</option>
                    <option value="tj">TJ</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-white/40">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {mounted && isAuthenticated && (
                <Link
                  href="/client/map"
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-primary font-semibold transition-colors px-2 py-1.5 rounded-xl hover:bg-primary/10"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Map
                </Link>
              )}

              {mounted ? (
                isAuthenticated && user ? (
                  <div className="relative" style={{ isolation: "isolate" }}>
                    {profileOpen && (
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => setProfileOpen(false)}
                      />
                    )}
                    <button
                      onClick={() => setProfileOpen((p) => !p)}
                      className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-3 py-2 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {initials}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white leading-none">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[11px] text-gray-400 leading-none mt-0.5">
                          {user.phone}
                        </p>
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {profileOpen && (
                      <div
                        className="fixed top-[68px] right-32 w-52 rounded-2xl shadow-2xl overflow-hidden z-[9999] border border-white/10"
                        style={{ background: "#0f2147" }}
                      >
                        <Link
                          href="/client"
                          onClick={() => setProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          My Trips
                        </Link>
                        <div className="border-t border-white/10" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          {tAuth("logout")}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/client/auth/login"
                      className="text-sm text-white/60 hover:text-white font-medium px-3 py-2 transition-colors"
                    >
                      {tAuth("login")}
                    </Link>
                    <Link
                      href="/client/auth/register"
                      className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                    >
                      {t("getStarted")}
                    </Link>
                  </div>
                )
              ) : (
                <div className="w-[180px] h-10" />
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white rounded-lg"
            >
              {open ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu */}
          {open && (
            <div className="md:hidden pb-4 border-t border-gray-100 dark:border-zinc-800 mt-2 pt-4 flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-gray-600 dark:text-zinc-400 font-medium py-1"
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  openSupport();
                }}
                className="text-left text-sm text-gray-600 dark:text-zinc-400 font-medium py-1"
              >
                {t("support")}
              </button>
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center justify-between pb-2">
                  <div className="relative">
                    <select
                      value={locale}
                      onChange={handleLanguageChange}
                      disabled={isPending}
                      className="appearance-none h-9 rounded-full border border-white/10 bg-white/5 text-white/80 text-sm font-semibold transition-colors hover:bg-white/10 pl-3 pr-7 cursor-pointer disabled:opacity-50 focus:outline-none"
                    >
                      <option value="en">EN</option>
                      <option value="ru">RU</option>
                      <option value="tj">TJ</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-white/40">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                {mounted &&
                  (isAuthenticated && user ? (
                    <>
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{user.phone}</p>
                        </div>
                      </div>
                      <Link
                        href="/client/map"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 font-medium py-2 px-1"
                      >
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Map
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="text-left text-sm text-red-500 font-medium py-2 px-1"
                      >
                        {tAuth("logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/client/auth/login"
                        className="text-sm text-gray-600 dark:text-zinc-400 font-medium py-2"
                      >
                        {tAuth("login")}
                      </Link>
                      <Link
                        href="/client/auth/register"
                        className="bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center"
                      >
                        {t("getStarted")}
                      </Link>
                    </>
                  ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 w-full max-w-sm rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {tm("title")}
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
              {tm("desc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-white font-bold py-3 rounded-xl transition-colors"
              >
                {tm("cancel")}
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20"
              >
                {tm("logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
