"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link, useRouter, usePathname } from "@/src/i18n/navigation";
import { useDispatch } from "react-redux";
import {
  useLoginMutation,
  useRegisterMutation,
} from "@/src/store/apis/userApi";
import { setCredentials } from "@/src/store/slices/authSlice";
import { useTranslations, useLocale } from "next-intl";
import { sileo } from "sileo";

interface AuthContainerProps {
  initialMode: "login" | "register";
}

export function AuthContainer({ initialMode }: AuthContainerProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const dispatch = useDispatch();

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const isActive = mode === "register";
  const [regStep, setRegStep] = useState(1);

  // Mutations
  const [login, { isLoading: isClientLoading }] = useLoginMutation();
  const [register, { isLoading: isRegLoading }] = useRegisterMutation();
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // States
  const [loginForm, setLoginForm] = useState({ phone: "", password: "" });
  const [regForm, setRegForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
  });
  const [error, setError] = useState("");

  const normalizePhone = (raw: string) => {
    const val = raw.toLowerCase().trim();
    if (val === "admin") return "admin";

    // Remove all non-digits
    const digits = raw.replace(/\D/g, "");

    if (digits.length === 0) return "";

    // If the input already starts with 992, treat it as the full international number
    if (digits.startsWith("992")) {
      return "+992 " + digits.slice(3, 12);
    }

    // Otherwise, treat input as the local part and prepend +992
    return "+992 " + digits.slice(0, 9);
  };

  const handleModeToggle = (newMode: "login" | "register") => {
    setMode(newMode);
    setError("");
    if (newMode === "register") setRegStep(1);
    const newPath =
      newMode === "login"
        ? `/${locale}/client/auth/login`
        : `/${locale}/client/auth/register`;
    window.history.replaceState(
      { ...window.history.state, as: newPath, url: newPath },
      "",
      newPath,
    );
  };

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleAdminLogin = async () => {
    setIsAdminLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "admin",
            password: loginForm.password,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Admin login failed");

      document.cookie = `admin_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      sileo.success({
        title: "Admin Access Granted",
        description: "Control Terminal opening in a new tab...",
      });

      setTimeout(() => {
        window.open(`/${locale}/admin`, "_blank");
        setIsAdminLoading(false);
        setLoginForm({ phone: "", password: "" });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Invalid admin credentials");
      sileo.error({ title: "Admin Login Failed" });
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.phone || !loginForm.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (loginForm.phone.toLowerCase() === "admin") {
      handleAdminLogin();
      return;
    }

    try {
      const result = await login({
        ...loginForm,
        phone: loginForm.phone.replace(/\s+/g, ""),
      }).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.token }));
      sileo.success({
        title: t("success.login"),
        description: t("success.loginSub"),
      });
      setTimeout(() => router.push("/"), 1000);
    } catch {
      setError("Invalid phone or password.");
      sileo.error({ title: "Login Failed" });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = regForm;
    if (
      !f.firstName ||
      !f.lastName ||
      !f.phone ||
      !f.password ||
      !f.dateOfBirth
    ) {
      setError("Please fill in all fields.");
      return;
    }
    if (f.password !== f.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (f.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    const sanitizedPhone = f.phone.replace(/\s+/g, "");
    const phoneRegex = /^\+992\d{9}$/;
    if (!phoneRegex.test(sanitizedPhone)) {
      setError("Phone format: +992 XXXXXXXXX");
      return;
    }

    try {
      await register({
        phone: sanitizedPhone,
        password: f.password,
        firstName: f.firstName,
        lastName: f.lastName,
        dateOfBirth: f.dateOfBirth,
      }).unwrap();
      sileo.success({
        title: t("success.register"),
        description: t("success.registerSub"),
      });
      setTimeout(() => handleModeToggle("login"), 1500);
    } catch (err: any) {
      setError(err?.data?.error ?? "Registration failed.");
    }
  };

  const isLoading = isClientLoading || isRegLoading || isAdminLoading;

  const socialLogins = [
    { name: "google", icon: "/google.svg" },
    { name: "facebook", icon: "/facebook.svg" },
    { name: "github", icon: "/github.svg" },
    { name: "linkedin", icon: "/linkedin.svg" },
  ];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div
        className={`relative overflow-hidden w-[768px] max-w-full min-h-[520px] bg-white dark:bg-zinc-900 rounded-[30px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] transition-all duration-700 ease-in-out ${isActive ? "active" : ""}`}
      >
        {/* SIGN UP FORM — 3-step wizard */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-[1] ${isActive ? "translate-x-full opacity-100 z-[5] auth-animate-move" : "opacity-0 z-[1]"}`}
        >
          <form
            onSubmit={handleRegisterSubmit}
            className="bg-white dark:bg-zinc-900 flex flex-col px-8 py-6 h-full overflow-y-auto"
          >
            {/* Step indicators */}
            <div className="flex flex-col gap-0 mb-6">
              {[
                { num: "01", label: "Your Name" },
                { num: "02", label: "Contact" },
                { num: "03", label: "Security" },
              ].map((s, i) => {
                const stepNum = i + 1;
                const isDone = regStep > stepNum;
                const isActive = regStep === stepNum;
                return (
                  <div
                    key={s.num}
                    className={`flex items-center gap-3 py-2 border-b border-gray-100 dark:border-zinc-800 transition-all duration-500 ${
                      isActive ? "opacity-100" : isDone ? "opacity-40" : "opacity-20"
                    }`}
                  >
                    <span className={`text-3xl font-black leading-none tabular-nums transition-colors duration-300 ${isActive ? "text-primary" : "text-gray-200 dark:text-zinc-700"}`}>
                      {s.num}
                    </span>
                    <div className="flex-1">
                      <p className={`text-xs font-bold transition-colors ${isActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-zinc-600"}`}>
                        {s.label}
                      </p>
                    </div>
                    {isDone && (
                      <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 1 — Name */}
            {regStep === 1 && (
              <div className="flex flex-col gap-2.5 flex-1 justify-center animate-in fade-in slide-in-from-right-4 duration-300">
                <input
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="First Name"
                  value={regForm.firstName}
                  onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })}
                  className="bg-gray-50 dark:bg-zinc-800/50 border-none px-4 py-3 text-xs rounded-xl w-full outline-none dark:text-white focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <input
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Last Name"
                  value={regForm.lastName}
                  onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })}
                  className="bg-gray-50 dark:bg-zinc-800/50 border-none px-4 py-3 text-xs rounded-xl w-full outline-none dark:text-white focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!regForm.firstName || !regForm.lastName) { setError("Enter your full name."); return; }
                    setError(""); setRegStep(2);
                  }}
                  className="bg-primary text-white text-xs py-3 px-8 rounded-xl font-bold uppercase tracking-widest mt-2 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2 — Contact */}
            {regStep === 2 && (
              <div className="flex flex-col gap-2.5 flex-1 justify-center animate-in fade-in slide-in-from-right-4 duration-300">
                <input
                  type="text"
                  name="phone"
                  autoComplete="tel"
                  placeholder="+992XXXXXXXXX"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: normalizePhone(e.target.value) })}
                  className="bg-gray-50 dark:bg-zinc-800/50 border-none px-4 py-3 text-xs rounded-xl w-full outline-none dark:text-white focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <input
                  type="date"
                  value={regForm.dateOfBirth}
                  onChange={(e) => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                  className="bg-gray-50 dark:bg-zinc-800/50 border-none px-4 py-3 text-xs rounded-xl w-full outline-none dark:text-white focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegStep(1)} className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-xs py-3 px-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!regForm.phone || !regForm.dateOfBirth) { setError("Fill in phone and date of birth."); return; }
                      setError(""); setRegStep(3);
                    }}
                    className="flex-1 bg-primary text-white text-xs py-3 px-4 rounded-xl font-bold uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Security */}
            {regStep === 3 && (
              <div className="flex flex-col gap-2.5 flex-1 justify-center animate-in fade-in slide-in-from-right-4 duration-300">
                <input
                  type="password"
                  placeholder="Password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="bg-gray-50 dark:bg-zinc-800/50 border-none px-4 py-3 text-xs rounded-xl w-full outline-none dark:text-white focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  className="bg-gray-50 dark:bg-zinc-800/50 border-none px-4 py-3 text-xs rounded-xl w-full outline-none dark:text-white focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {error && isActive && (
                  <p className="text-[10px] text-red-500 font-medium">{error}</p>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegStep(2)} className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-xs py-3 px-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all">
                    ← Back
                  </button>
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="flex-1 bg-primary text-white text-xs py-3 px-4 rounded-xl font-bold uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                  >
                    {isLoading ? "Creating..." : t("registerButton")}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* SIGN IN FORM */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-[2] ${isActive ? "translate-x-full" : ""}`}
        >
          <form
            onSubmit={handleLoginSubmit}
            className="bg-white dark:bg-zinc-900 flex items-center justify-center flex-col px-10 h-full text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {loginForm.phone === "admin" ? "Admin" : t("login")}
            </h1>

            <div className="flex gap-2.5 mb-5">
              {socialLogins.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  className="w-10 h-10 border border-gray-100 dark:border-zinc-800 rounded-xl flex items-center justify-center bg-white hover:border-primary transition-all group shadow-sm"
                >
                  <Image
                    src={s.icon}
                    alt={s.name}
                    width={20}
                    height={20}
                    className="group-hover:scale-110 transition-transform"
                  />
                </button>
              ))}
            </div>

            <span className="text-[11px] font-medium text-gray-400 mb-4 uppercase tracking-wider">
              or use your phone account
            </span>

            <input
              type="text"
              name="phone"
              autoComplete="tel"
              placeholder="+992XXXXXXXXX"
              value={loginForm.phone}
              onChange={(e) =>
                setLoginForm({
                  ...loginForm,
                  phone: normalizePhone(e.target.value),
                })
              }
              className="bg-gray-50 dark:bg-zinc-800/50 border-none px-4 py-3 text-xs rounded-xl w-full mb-2.5 outline-none dark:text-white focus:ring-2 focus:ring-primary/20 transition-all"
            />

            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              className="bg-gray-50 dark:bg-zinc-800/50 border-none px-4 py-3 text-xs rounded-xl w-full mb-1.5 outline-none dark:text-white focus:ring-2 focus:ring-primary/20 transition-all"
            />

            <a
              href="#"
              className="text-xs text-gray-400 mb-6 hover:text-primary transition-colors"
            >
              Forget Your Password?
            </a>

            {error && !isActive && (
              <p className="text-[10px] text-red-500 mb-3 font-medium">
                {error}
              </p>
            )}

            <button
              disabled={isLoading}
              type="submit"
              className="bg-primary text-white text-xs py-3 px-12 rounded-xl font-bold uppercase tracking-widest cursor-pointer hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              {isLoading ? "Wait..." : t("loginButton")}
            </button>

            <button
              type="button"
              onClick={() => {
                if (loginForm.phone === "admin") {
                  setLoginForm({ phone: "", password: "" });
                  sileo.info({
                    title: "User Mode",
                    description: "Standard login enabled.",
                  });
                } else {
                  setLoginForm({ phone: "admin", password: "" });
                  sileo.info({
                    title: "Admin Mode",
                    description: "Enter administrator password.",
                  });
                }
              }}
              className="mt-8 text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 dark:text-zinc-700 hover:text-primary transition-colors"
            >
              {loginForm.phone === "admin"
                ? "Back to User Login"
                : "System Terminal Access"}
            </button>
          </form>
        </div>

        {/* TOGGLE OVERLAY */}
        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-700 ease-in-out z-[1000] ${isActive ? "-translate-x-full rounded-r-[150px] rounded-l-none" : "rounded-l-[150px] rounded-r-none"}`}
        >
          <div
            className={`bg-primary h-full bg-gradient-to-r from-primary-dark to-primary text-white relative left-[-100%] w-[200%] transition-all duration-700 ease-in-out ${isActive ? "translate-x-1/2" : "translate-x-0"}`}
          >
            <div
              className={`absolute w-1/2 h-full flex items-center justify-center flex-col px-10 text-center top-0 transition-all duration-700 ease-in-out ${isActive ? "translate-x-0" : "-translate-x-[200%]"}`}
            >
              <h1 className="text-3xl font-bold mb-5">Welcome Back!</h1>
              <p className="text-sm leading-6 tracking-wide mb-8 opacity-90 font-medium">
                Enter your personal details to use all of site features
              </p>
              <button
                onClick={() => handleModeToggle("login")}
                className="bg-transparent text-white text-xs py-3 px-12 border-2 border-white rounded-xl font-bold uppercase tracking-widest cursor-pointer hover:bg-white hover:text-primary transition-all active:scale-95"
              >
                Sign In
              </button>
            </div>

            <div
              className={`absolute w-1/2 h-full flex items-center justify-center flex-col px-10 text-center top-0 right-0 transition-all duration-700 ease-in-out ${isActive ? "translate-x-[200%]" : "translate-x-0"}`}
            >
              <h1 className="text-3xl font-bold mb-5">Hello, Friend!</h1>
              <p className="text-sm leading-6 tracking-wide mb-8 opacity-90 font-medium">
                Register with your personal details to use all of site features
              </p>
              <button
                onClick={() => handleModeToggle("register")}
                className="bg-transparent text-white text-xs py-3 px-12 border-2 border-white rounded-xl font-bold uppercase tracking-widest cursor-pointer hover:bg-white hover:text-primary transition-all active:scale-95"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .active .z-5 {
          z-index: 5;
        }
      `}</style>
    </div>
  );
}
