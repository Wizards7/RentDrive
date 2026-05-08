// ── Enums ────────────────────────────────────────────────────────────────────

export type CarClass = "ECONOMY" | "COMFORT" | "CROSSOVER";
export type CarStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE";
export type RentalPackage = "PER_MINUTE" | "H3" | "H6" | "H12" | "H24";
export type RentalStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type TaskType = "REFUEL" | "MAINTENANCE" | "WASH";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type Locale = "en" | "ru" | "tj";

// ── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  phoneVerified: boolean;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  tajikPassportNumber: string | null;
  tajikPassportVerified: boolean;
  driverLicenseNumber: string | null;
  driverLicenseVerified: boolean;
  createdAt: string;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

// ── Tariff ───────────────────────────────────────────────────────────────────

export interface PackageDetail {
  price: number;
  includedKm: number;
}

export interface Tariff {
  carClass: CarClass;
  perMinDriving: number;
  perMinWaiting: number;
  perKm: number;
  packages: {
    H3: PackageDetail;
    H6: PackageDetail;
    H12: PackageDetail;
    H24: PackageDetail;
  };
  includesFuel: boolean;
  includesParkingWash: boolean;
}

// ── Car ──────────────────────────────────────────────────────────────────────

export interface Car {
  id: string;
  licensePlate: string;
  model: string;
  year: number | null;
  carClass: CarClass;
  features: string[];
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  fuelLevel: number;
  status: CarStatus;
  distanceMeters?: number;
  tariff?: Tariff;
}

// ── Rental ───────────────────────────────────────────────────────────────────

export interface Rental {
  id: string;
  userId: string;
  carId: string;
  package: RentalPackage;
  startTime: string;
  endTime: string | null;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number | null;
  endLongitude: number | null;
  drivingMinutes: number;
  waitingMinutes: number;
  distanceKm: number;
  totalCost: number | null;
  currency: string;
  status: RentalStatus;
}

export interface HistoryRental extends Rental {
  car: {
    model: string;
    carClass: CarClass;
    licensePlate: string;
    imageUrl: string | null;
  };
}

export interface CostBreakdown {
  base: number;
  overageKm: number;
  total: number;
  currency: string;
  includesFuel: boolean;
  includesParkingWash: boolean;
  packageUsed: RentalPackage;
}

// ── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  type: TaskType;
  carId: string;
  car: {
    model: string;
    licensePlate: string;
    latitude: number;
    longitude: number;
    fuelLevel: number;
  };
  status: TaskStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── API Response wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: string;
}
