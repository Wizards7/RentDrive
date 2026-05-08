"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const mockTasks = [
  { id: "t1", type: "REFUEL", carPlate: "TJ-9900-ST", carModel: "Nissan Qashqai", status: "PENDING", notes: "Vehicle stuck at City Center lot with <5% fuel level.", createdAt: "2025-04-30" },
  { id: "t2", type: "WASH", carPlate: "TJ-1234-CD", carModel: "Toyota Vitz", status: "IN_PROGRESS", notes: "Customer feedback reported dirty exterior after mountain trip.", createdAt: "2025-04-29" },
  { id: "t3", type: "MAINTENANCE", carPlate: "TJ-7788-AB", carModel: "Hyundai Accent", status: "PENDING", notes: "Annual inspection scheduled.", createdAt: "2025-04-28" },
  { id: "t4", type: "REFUEL", carPlate: "TJ-6677-GH", carModel: "Daewoo Nexia", status: "COMPLETED", notes: "Refueled at Korvon station.", createdAt: "2025-04-27" },
  { id: "t5", type: "WASH", carPlate: "TJ-4455-EF", carModel: "Chevrolet Cobalt", status: "COMPLETED", notes: "Full exterior wash completed.", createdAt: "2025-04-26" },
];

const typeStyles: Record<string, string> = {
  REFUEL: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  WASH: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  MAINTENANCE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  COMPLETED: "bg-green-500/10 text-green-600 dark:text-green-400",
};

const typeIcons: Record<string, string> = {
  REFUEL: "⛽",
  WASH: "🚿",
  MAINTENANCE: "🔧",
};

export default function AdminTasksPage() {
  const t = useTranslations("admin.tasks");
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? mockTasks : mockTasks.filter((t) => t.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t("title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 font-medium">{t("subtitle", { count: mockTasks.filter((t) => t.status === "PENDING").length })}</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              filter === f 
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/25 scale-105" 
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            {t(`filters.${f.toLowerCase() === "all" ? "all" : f.toLowerCase() === "in_progress" ? "inProgress" : f.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {/* Task cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((task) => (
          <div key={task.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-lg shadow-sm">
                  {typeIcons[task.type]}
                </div>
                <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full border ${typeStyles[task.type]}`}>
                  {task.type}
                </span>
              </div>
              <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full ${statusStyles[task.status]}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>

            <div>
              <p className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{task.carModel}</p>
              <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1">{task.carPlate}</p>
            </div>

            {task.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-800/50 pt-4 font-medium italic">"{task.notes}"</p>
            )}

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-800/50">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{task.createdAt}</span>
              {task.status !== "COMPLETED" && (
                <button className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all shadow-sm">
                  {task.status === "PENDING" ? t("begin") : t("finish")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
