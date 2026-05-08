"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

type CarStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE";
type CarClass  = "ECONOMY" | "COMFORT" | "CROSSOVER";

interface RentalUser { id: string; firstName: string; lastName: string; phone: string; }
interface Rental {
  id: string; package: string; startTime: string; endTime: string | null;
  totalCost: number | null; distanceKm: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  user: RentalUser;
}
interface CarDetail {
  id: string; licensePlate: string; model: string; year: number | null;
  carClass: CarClass; features: string[]; imageUrl: string | null;
  fuelLevel: number; status: CarStatus; latitude: number; longitude: number;
  zone: "green" | "yellow" | "red";
  tariff: { perMinDriving: number; package3h: number; package6h: number; package24h: number } | null;
  stats: { totalRentals: number; completedRentals: number; totalRevenue: number; totalKm: number };
  rentals: Rental[];
}

interface EditForm {
  model: string; licensePlate: string; year: string;
  carClass: CarClass; fuelLevel: string; features: string; status: CarStatus;
}

const statusStyles: Record<CarStatus, string> = {
  AVAILABLE:   "bg-green-500/10 text-green-600 border-green-500/20",
  RENTED:      "bg-blue-500/10 text-blue-600 border-blue-500/20",
  MAINTENANCE: "bg-red-500/10 text-red-500 border-red-500/20",
};
const zoneStyles = {
  green:  "bg-green-500/10 text-green-600 border-green-500/20",
  yellow: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  red:    "bg-red-500/10 text-red-500 border-red-500/20",
};

function getAdminToken() {
  return document.cookie.split("; ").find((r) => r.startsWith("admin_token="))?.split("=")[1] ?? "";
}

export default function CarDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const carId    = params.id as string;
  const editFileRef = useRef<HTMLInputElement>(null);

  const [car, setCar]           = useState<CarDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editImage, setEditImage]     = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchCar = useCallback(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars/${carId}/detail`, {
      headers: { Authorization: `Bearer ${getAdminToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setCar(d.car ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carId]);

  useEffect(() => { fetchCar(); }, [fetchCar]);

  const openEdit = () => {
    if (!car) return;
    setEditForm({
      model: car.model, licensePlate: car.licensePlate,
      year: car.year?.toString() ?? "", carClass: car.carClass,
      fuelLevel: car.fuelLevel.toString(), features: car.features.join(", "),
      status: car.status,
    });
    setEditImage(null); setEditPreview(null); setSaveError("");
    setEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    const body = new FormData();
    body.append("model", editForm.model);
    body.append("licensePlate", editForm.licensePlate);
    if (editForm.year) body.append("year", editForm.year);
    body.append("carClass", editForm.carClass);
    body.append("fuelLevel", editForm.fuelLevel);
    body.append("features", editForm.features);
    body.append("status", editForm.status);
    if (editImage) body.append("image", editImage);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars/${carId}`, {
      method: "PATCH", headers: { Authorization: `Bearer ${getAdminToken()}` }, body,
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveError(data.error ?? "Failed to save"); return; }
    setEditOpen(false);
    fetchCar();
  };

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
    </div>
  );

  if (!car) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-gray-400 text-sm">Car not found.</p>
      <button onClick={() => router.back()} className="text-sm text-primary font-bold hover:underline">← Back to Fleet</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => router.push("/admin/cars")} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Fleet</button>
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="font-bold text-gray-900 dark:text-white">{car.model}</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span className="font-mono text-gray-400">{car.licensePlate}</span>
      </div>

      {/* ── Hero card — image left, stats right ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row">

          {/* Car image */}
          <div className="relative lg:w-[42%] h-56 lg:h-auto bg-gray-100 dark:bg-gray-800 shrink-0">
            {car.imageUrl ? (
              <Image src={car.imageUrl} alt={car.model} fill className="object-cover" unoptimized />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-2">
                <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1V5h4l3 5v5h-1m-1 1H9" />
                </svg>
                <span className="text-sm font-semibold">No photo</span>
              </div>
            )}
            {/* Overlay gradient for dark aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Right: info + stats */}
          <div className="flex-1 p-6 flex flex-col gap-5">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">{car.model}</h1>
                <p className="text-sm font-mono text-gray-400 mt-0.5">{car.licensePlate} · {car.year ?? "—"}</p>
              </div>
              <button onClick={openEdit}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-primary/20 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
            </div>

            {/* Status + zone + class badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`text-[11px] font-black px-3 py-1.5 rounded-full border uppercase tracking-wider ${statusStyles[car.status]}`}>{car.status}</span>
              <span className={`text-[11px] font-black px-3 py-1.5 rounded-full border uppercase tracking-wider ${zoneStyles[car.zone]}`}>{car.zone} zone</span>
              <span className="text-[11px] font-black px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider">{car.carClass}</span>
            </div>

            {/* Revenue stats — Uber/Yandex style */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Trips",  value: String(car.stats.totalRentals),           sub: `${car.stats.completedRentals} completed` },
                { label: "Revenue",      value: `${car.stats.totalRevenue.toLocaleString()} TJS`, sub: "lifetime" },
                { label: "Distance",     value: `${car.stats.totalKm.toLocaleString()} km`, sub: "total driven" },
                { label: "Rate",         value: car.tariff ? `${car.tariff.perMinDriving} TJS` : "—", sub: "per minute" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{s.label}</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Fuel bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Fuel Level</p>
                <span className={`text-sm font-black ${car.fuelLevel <= 20 ? "text-red-500" : car.fuelLevel <= 50 ? "text-amber-500" : "text-green-600 dark:text-green-400"}`}>{car.fuelLevel}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${car.fuelLevel > 50 ? "bg-green-500" : car.fuelLevel > 20 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${car.fuelLevel}%` }} />
              </div>
              {car.fuelLevel <= 20 && <p className="text-[10px] text-red-500 font-semibold mt-1">Low fuel — refuel required</p>}
            </div>

            {/* Features */}
            {car.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {car.features.map((f) => (
                  <span key={f} className="text-[11px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">{f}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Rental History ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white">Trip History</h2>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-bold">{car.rentals.length} trips</span>
        </div>

        {car.rentals.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No trips recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-gray-800">
                  {["Driver", "Package", "Date", "Duration", "Distance", "Revenue", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {car.rentals.map((r, i) => {
                  const durMin = r.endTime
                    ? Math.round((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000)
                    : null;
                  return (
                    <tr key={r.id} className={`${i < car.rentals.length - 1 ? "border-b border-gray-50 dark:border-gray-800/50" : ""} hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors`}>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{r.user.firstName} {r.user.lastName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{r.user.phone}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-500 dark:text-gray-400">{r.package}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{new Date(r.startTime).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{durMin !== null ? `${durMin} min` : "Active"}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{r.distanceKm?.toFixed(1)} km</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-gray-900 dark:text-white">{r.totalCost !== null ? `${r.totalCost.toFixed(0)} TJS` : "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === "COMPLETED" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                          r.status === "ACTIVE"    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                                     "bg-gray-100 dark:bg-gray-800 text-gray-400"
                        }`}>{r.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit slide-over ── */}
      {editOpen && editForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Edit Vehicle</h2>
                <p className="text-xs text-gray-400 font-mono">{car.licensePlate}</p>
              </div>
              <button onClick={() => setEditOpen(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
              {/* Photo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Car Photo</label>
                <div onClick={() => editFileRef.current?.click()}
                  className={`relative w-full h-40 rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors ${editPreview || car.imageUrl ? "border-primary/30" : "border-gray-200 dark:border-gray-700 hover:border-primary/40"}`}>
                  {(editPreview || car.imageUrl) ? (
                    <>
                      <Image src={editPreview ?? car.imageUrl!} alt="Preview" fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Change Photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-1.5 text-gray-400">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                      <p className="text-xs font-semibold">Click to upload</p>
                    </div>
                  )}
                </div>
                <input ref={editFileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.avif" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0] ?? null; setEditImage(f); setEditPreview(f ? URL.createObjectURL(f) : null); }} />
              </div>

              {/* Model */}
              <Field label="Model" required>
                <input value={editForm.model} onChange={(e) => setEditForm((p) => p && ({ ...p, model: e.target.value }))}
                  className="input-field" placeholder="Hyundai Accent" />
              </Field>

              {/* Plate + Year */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="License Plate" required>
                  <input value={editForm.licensePlate} onChange={(e) => setEditForm((p) => p && ({ ...p, licensePlate: e.target.value }))}
                    className="input-field font-mono" placeholder="TJ-0000-AB" />
                </Field>
                <Field label="Year">
                  <input type="number" value={editForm.year} onChange={(e) => setEditForm((p) => p && ({ ...p, year: e.target.value }))}
                    className="input-field" placeholder="2024" min={2000} max={2030} />
                </Field>
              </div>

              {/* Class + Fuel */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select value={editForm.carClass} onChange={(e) => setEditForm((p) => p && ({ ...p, carClass: e.target.value as CarClass }))} className="input-field">
                    <option value="ECONOMY">Economy</option>
                    <option value="COMFORT">Comfort</option>
                    <option value="CROSSOVER">Crossover</option>
                  </select>
                </Field>
                <Field label="Fuel %">
                  <input type="number" value={editForm.fuelLevel} onChange={(e) => setEditForm((p) => p && ({ ...p, fuelLevel: e.target.value }))}
                    className="input-field" min={0} max={100} />
                </Field>
              </div>

              {/* Status */}
              <Field label="Status">
                <div className="grid grid-cols-3 gap-2">
                  {(["AVAILABLE", "RENTED", "MAINTENANCE"] as CarStatus[]).map((s) => (
                    <button key={s} type="button" onClick={() => setEditForm((p) => p && ({ ...p, status: s }))}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${editForm.status === s ? statusStyles[s] : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Features */}
              <Field label="Features (comma-separated)">
                <input value={editForm.features} onChange={(e) => setEditForm((p) => p && ({ ...p, features: e.target.value }))}
                  className="input-field" placeholder="AC, Bluetooth, Heated Seats" />
              </Field>

              {saveError && <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-xl px-4 py-3">{saveError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-bold py-3 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-primary/20">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input-field {
          width: 100%;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          color: #111827;
          outline: none;
          transition: all 0.15s;
        }
        .dark .input-field {
          background: #1f2937;
          border-color: #374151;
          color: white;
        }
        .input-field:focus {
          border-color: var(--color-primary, #2D8A1E);
          box-shadow: 0 0 0 3px rgba(45,138,30,0.15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
