"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function AdminProfilePage() {
  const t = useTranslations("admin.profilePage");
  const tm = useTranslations("admin.logoutModal");
  const locale = useLocale();
  const [username] = useState("admin");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setMsg({ type: "error", text: "Passwords do not match" }); return; }
    if (newPassword.length < 6) { setMsg({ type: "error", text: "Password must be at least 6 characters" }); return; }
    setLoading(true);

    const token = document.cookie.split("; ").find((r) => r.startsWith("admin_token="))?.split("=")[1];
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    setLoading(false);
    if (res.ok) {
      setMsg({ type: "success", text: "Password changed successfully" });
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
    } else {
      const data = await res.json();
      setMsg({ type: "error", text: data.error ?? "Failed to change password" });
    }
  };

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; max-age=0";
    window.location.href = `/${locale}/client/auth/login`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t("title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Profile card */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary text-2xl font-black shrink-0">
          A
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{username}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Administrator · Full access</p>
          <span className="mt-2 inline-flex text-xs bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium">
            Admin Terminal
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("accountInfo")}</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Username", value: username },
            { label: "Role", value: "Super Admin" },
            { label: "Access Level", value: "Full" },
            { label: "2FA", value: "Not configured" },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-transparent rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5 font-bold">{item.label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t("changePassword")}</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("currentPassword")}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("newPassword")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("confirmPassword")}</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {msg && (
            <div className={`text-sm px-4 py-2.5 rounded-xl ${msg.type === "success" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors mt-1 shadow-md shadow-primary/20"
          >
            {loading ? t("saving") : t("updateButton")}
          </button>
        </form>
      </div>

      {/* Sign out button */}
      <button
        onClick={() => setShowLogoutModal(true)}
        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors w-fit font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {t("signOut")}
      </button>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{tm("title")}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
              {tm("desc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-bold py-3 rounded-xl transition-colors"
              >
                {tm("cancel")}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20"
              >
                {tm("logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
