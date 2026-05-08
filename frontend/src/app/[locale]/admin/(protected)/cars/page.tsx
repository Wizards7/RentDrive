"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type CarStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE";
type CarClass  = "ECONOMY" | "COMFORT" | "CROSSOVER";

interface Car {
  id: string;
  licensePlate: string;
  model: string;
  year: number | null;
  carClass: CarClass;
  features: string[];
  imageUrl: string | null;
  fuelLevel: number;
  status: CarStatus;
}

interface AddCarForm {
  model: string; licensePlate: string; year: string;
  carClass: CarClass; fuelLevel: string; features: string;
}

const statusStyles: Record<CarStatus, string> = {
  AVAILABLE:   "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  RENTED:      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  MAINTENANCE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const classStyles: Record<CarClass, string> = {
  ECONOMY:   "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  COMFORT:   "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  CROSSOVER: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const emptyForm: AddCarForm = {
  model: "", licensePlate: "", year: "", carClass: "ECONOMY", fuelLevel: "100", features: "",
};

function getAdminToken() {
  return document.cookie.split("; ").find((r) => r.startsWith("admin_token="))?.split("=")[1] ?? "";
}

export default function AdminCarsPage() {
  const t = useTranslations("admin.overview.inventory");
  const router = useRouter();
  const [cars, setCars]     = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const [showAddModal, setShowAddModal]   = useState(false);
  const [addForm, setAddForm]             = useState<AddCarForm>(emptyForm);
  const [addImage, setAddImage]           = useState<File | null>(null);
  const [addPreview, setAddPreview]       = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError]           = useState("");
  const addFileRef = useRef<HTMLInputElement>(null);

  const fetchCars = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars`, {
      headers: { Authorization: `Bearer ${getAdminToken()}` },
    });
    if (res.ok) { const d = await res.json(); setCars(d.cars); }
    setLoading(false);
  };

  useEffect(() => { fetchCars(); }, []);

  const filtered = filter === "ALL" ? cars : cars.filter((c) => c.carClass === filter);

  const resetAdd = () => {
    setShowAddModal(false); setAddForm(emptyForm);
    setAddImage(null); setAddPreview(null); setAddError("");
    if (addFileRef.current) addFileRef.current.value = "";
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setAddImage(f);
    setAddPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.model || !addForm.licensePlate) { setAddError("Model and license plate are required."); return; }
    setAddSubmitting(true);
    const body = new FormData();
    body.append("model", addForm.model);
    body.append("licensePlate", addForm.licensePlate);
    if (addForm.year) body.append("year", addForm.year);
    body.append("carClass", addForm.carClass);
    body.append("fuelLevel", addForm.fuelLevel || "100");
    body.append("features", addForm.features);
    if (addImage) body.append("image", addImage);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars`, {
      method: "POST", headers: { Authorization: `Bearer ${getAdminToken()}` }, body,
    });
    const data = await res.json();
    setAddSubmitting(false);
    if (!res.ok) { setAddError(data.error ?? "Failed to add car"); return; }
    setCars((p) => [data.car, ...p]);
    resetAdd();
  };

  /* ── Stats bar ── */
  const total       = cars.length;
  const available   = cars.filter((c) => c.status === "AVAILABLE").length;
  const rented      = cars.filter((c) => c.status === "RENTED").length;
  const maintenance = cars.filter((c) => c.status === "MAINTENANCE").length;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t("title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 font-medium">
            {loading ? "Loading…" : `${total} vehicles · click any row to manage`}
          </p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setAddError(""); setAddForm(emptyForm); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Car
        </button>
      </div>

      {/* ── Fleet stats ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: total, color: "text-gray-900 dark:text-white", bg: "bg-white dark:bg-gray-900" },
          { label: "Available", value: available, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/5 dark:bg-green-500/10" },
          { label: "On Trip", value: rented, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/5 dark:bg-blue-500/10" },
          { label: "Maintenance", value: maintenance, color: "text-red-500", bg: "bg-red-500/5 dark:bg-red-500/10" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 shadow-sm`}>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["ALL", "ECONOMY", "COMFORT", "CROSSOVER"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              filter === f
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading fleet…</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">No vehicles found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {[t("model"), t("plate"), "Year", t("class"), t("fuel"), t("status"), ""].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((car, i) => (
                  <tr
                    key={car.id}
                    onClick={() => router.push(`/admin/cars/${car.id}`)}
                    className={`group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${i < filtered.length - 1 ? "border-b border-gray-50 dark:border-gray-800/50" : ""}`}
                  >
                    {/* Model + image */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-9 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-200 dark:border-gray-700">
                          {car.imageUrl ? (
                            <Image src={car.imageUrl} alt={car.model} width={56} height={36} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1V5h4l3 5v5h-1m-1 1H9" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{car.model}</p>
                          {car.features.length > 0 && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{car.features.slice(0, 2).join(" · ")}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-mono text-gray-600 dark:text-gray-400 font-medium">{car.licensePlate}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{car.year ?? "—"}</td>

                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${classStyles[car.carClass]}`}>{car.carClass}</span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${car.fuelLevel > 50 ? "bg-green-500" : car.fuelLevel > 20 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${car.fuelLevel}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${car.fuelLevel <= 20 ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>{car.fuelLevel}%</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusStyles[car.status]}`}>{car.status}</span>
                    </td>

                    {/* Arrow */}
                    <td className="px-5 py-4">
                      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add New Car Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 rounded-t-3xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Car</h2>
                <p className="text-xs text-gray-400 mt-0.5">Register a new vehicle to the fleet</p>
              </div>
              <button onClick={resetAdd} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 flex flex-col gap-4">
              {/* Image upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Car Photo</label>
                <div onClick={() => addFileRef.current?.click()}
                  className={`relative w-full h-32 rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors ${addPreview ? "border-primary/40" : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
                  {addPreview ? (
                    <>
                      <Image src={addPreview} alt="Preview" fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Change Photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-1.5 text-gray-400">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                      <p className="text-xs font-semibold">Click to upload</p>
                      <p className="text-[10px] text-gray-300 dark:text-gray-600">JPG, PNG, WEBP · max 5 MB</p>
                    </div>
                  )}
                </div>
                <input ref={addFileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.avif" onChange={handleAddFile} className="hidden" />
              </div>
              {/* Model */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Model <span className="text-red-500">*</span></label>
                <input value={addForm.model} onChange={(e) => setAddForm((p) => ({ ...p, model: e.target.value }))} placeholder="e.g. Hyundai Accent"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              {/* Plate + Year */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">License Plate <span className="text-red-500">*</span></label>
                  <input value={addForm.licensePlate} onChange={(e) => setAddForm((p) => ({ ...p, licensePlate: e.target.value }))} placeholder="TJ-0000-AB"
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Year</label>
                  <input type="number" value={addForm.year} onChange={(e) => setAddForm((p) => ({ ...p, year: e.target.value }))} placeholder="2024" min={2000} max={2030}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>
              {/* Class + Fuel */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Category</label>
                  <select value={addForm.carClass} onChange={(e) => setAddForm((p) => ({ ...p, carClass: e.target.value as CarClass }))}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                    <option value="ECONOMY">Economy</option>
                    <option value="COMFORT">Comfort</option>
                    <option value="CROSSOVER">Crossover</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Fuel Level (%)</label>
                  <input type="number" value={addForm.fuelLevel} onChange={(e) => setAddForm((p) => ({ ...p, fuelLevel: e.target.value }))} min={0} max={100}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>
              {/* Features */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Features <span className="text-gray-400 font-normal normal-case">(comma-separated)</span></label>
                <input value={addForm.features} onChange={(e) => setAddForm((p) => ({ ...p, features: e.target.value }))} placeholder="AC, Bluetooth, Heated Seats"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              {addError && <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">{addError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetAdd} className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-bold py-3 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={addSubmitting} className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-primary/20">
                  {addSubmitting ? "Adding…" : "Add Car"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
