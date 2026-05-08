"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneVerified: boolean;
  tajikPassportVerified: boolean;
  driverLicenseVerified: boolean;
  isBlocked: boolean;
  isVip: boolean;
  vipDiscount: number;
  rating: number;
  isBlacklisted: boolean;
  createdAt: string;
  _count?: { rentals: number };
}

function getToken() {
  return (
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("admin_token="))
      ?.split("=")[1] ?? ""
  );
}

export default function AdminUsersPage() {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [vipModal, setVipModal] = useState<{ userId: string; name: string } | null>(null);
  const [vipDiscount, setVipDiscount] = useState("10");

  const fetchUsers = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBlock = async (id: string) => {
    setActionLoading(id + "-block");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/block`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    fetchUsers();
    setActionLoading(null);
  };

  const handleVip = async (id: string, discount: number) => {
    setActionLoading(id + "-vip");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/vip`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ isVip: true, vipDiscount: discount }),
    });
    fetchUsers();
    setActionLoading(null);
    setVipModal(null);
  };

  const handleRemoveVip = async (id: string) => {
    setActionLoading(id + "-vip");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/vip`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ isVip: false, vipDiscount: 0 }),
    });
    fetchUsers();
    setActionLoading(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setActionLoading(id + "-delete");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    fetchUsers();
    setActionLoading(null);
  };

  const filtered = users.filter(
    (u) =>
      `${u.firstName} ${u.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) || u.phone.includes(search)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{t("subtitle", { count: users.length })}</p>
        </div>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> {t("vip")}
          </span>
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500" /> {t("blocked")}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 w-72 shadow-sm focus-within:border-primary transition-colors">
        <svg
          className="w-4 h-4 text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none w-full"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            {t("loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            {t("noUsers")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {[t("table.user"), t("table.phone"), t("table.documents"), "Rating", t("table.status"), t("table.joined"), t("table.actions")].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3.5 text-[10px] text-gray-400 uppercase tracking-wider font-bold"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${i < filtered.length - 1 ? "border-b border-gray-50 dark:border-gray-800/50" : ""} ${user.isBlocked || user.isBlacklisted ? "opacity-60 grayscale-[0.5]" : ""}`}
                  >
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${user.isVip ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary"}`}
                        >
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </p>
                            {user.isVip && (
                              <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                {t("vip")} {user.vipDiscount}%
                              </span>
                            )}
                            {user.isBlocked && (
                              <span className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                {t("blocked")}
                              </span>
                            )}
                            {user.isBlacklisted && (
                              <span className="text-[10px] bg-gray-900/10 text-gray-700 dark:text-gray-300 border border-gray-400/20 px-1.5 py-0.5 rounded-full font-bold">
                                Blacklisted
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono tracking-tighter">
                            {user._count?.rentals ?? 0} rentals
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-3.5 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {user.phone}
                    </td>

                    {/* Documents */}
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${user.tajikPassportVerified ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent"}`}>
                          Passport
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${user.driverLicenseVerified ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent"}`}>
                          License
                        </span>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-black ${user.rating >= 4 ? "text-green-600 dark:text-green-400" : user.rating >= 2 ? "text-amber-500" : "text-red-500"}`}>
                          {user.rating?.toFixed(1)}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600 text-xs">/5</span>
                      </div>
                    </td>

                    {/* Status toggle */}
                    <td className="px-5 py-3.5">
                      <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${user.phoneVerified ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${user.phoneVerified ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {/* Block/Unblock */}
                        <button
                          onClick={() => handleBlock(user.id)}
                          disabled={actionLoading === user.id + "-block"}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${user.isBlocked ? "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"}`}
                        >
                          {user.isBlocked ? (
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
                                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                              />
                            </svg>
                          ) : (
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
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 11V7a2 2 0 114 0v4"
                              />
                            </svg>
                          )}
                        </button>

                        {/* VIP */}
                        <button
                          onClick={() =>
                            user.isVip
                              ? handleRemoveVip(user.id)
                              : setVipModal({
                                  userId: user.id,
                                  name: `${user.firstName} ${user.lastName}`,
                                })
                          }
                          disabled={actionLoading === user.id + "-vip"}
                          className={`p-1.5 rounded-lg text-sm transition-colors shadow-sm ${user.isVip ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-amber-500"}`}
                        >
                          ⭐
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() =>
                            handleDelete(
                              user.id,
                              `${user.firstName} ${user.lastName}`
                            )
                          }
                          disabled={actionLoading === user.id + "-delete"}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIP discount modal */}
      {vipModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-[60] px-4 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              {t("grantVip")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t("setDiscount", { name: vipModal.name })}
            </p>
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {t("discountPercent")}
              </label>
              <div className="flex gap-2">
                {["5", "10", "15", "20", "25"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setVipDiscount(d)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${vipDiscount === d ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-105" : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setVipModal(null)}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={() =>
                    handleVip(vipModal.userId, parseInt(vipDiscount))
                  }
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-black transition-all shadow-lg shadow-amber-500/25"
                >
                  {t("grant")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
