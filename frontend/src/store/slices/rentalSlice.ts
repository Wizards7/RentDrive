import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/src/store";

export interface ActiveRental {
  id: string;
  carId: string;
  package: string;
  startTime: string;
  elapsedMins: number;
  remainingMins: number | null;
  pkgLimit: number | null;
  isOverLimit: boolean;
  liveCost: number;
  perMinRate: number;
  car: {
    model: string;
    carClass: string;
    licensePlate: string;
    imageUrl: string | null;
    fuelLevel: number;
  };
}

export interface TripReceipt {
  orderId: string;
  carName: string;
  carClass: string;
  carImage: string | null;
  licensePlate: string;
  startTime: string;
  endTime: string;
  durationMins: number;
  distanceKm: number;
  zone: string;
  package: string;
  breakdown: {
    base: number;
    overageKm: number;
    overageMins: number;
    penaltyCost: number;
    subtotal: number;
    discountPct: number;
    discountTier: string;
    discountAmt: number;
    finalTotal: number;
  };
  currency: string;
  paymentMethod: string;
  userRating: number | null;
}

interface RentalState {
  activeRental: ActiveRental | null;
  showSummary: boolean;
  receipt: TripReceipt | null;
  userRating: number;
  finishing: boolean;
  finishError: string | null;
}

const initialState: RentalState = {
  activeRental: null,
  showSummary: false,
  receipt: null,
  userRating: 0,
  finishing: false,
  finishError: null,
};

export const rentalSlice = createSlice({
  name: "rental",
  initialState,
  reducers: {
    setActiveRental(state, action: PayloadAction<ActiveRental | null>) {
      state.activeRental = action.payload;
    },
    updateLiveCost(state, action: PayloadAction<{ elapsedMins: number; liveCost: number; remainingMins: number | null; isOverLimit: boolean }>) {
      if (state.activeRental) {
        state.activeRental.elapsedMins   = action.payload.elapsedMins;
        state.activeRental.liveCost      = action.payload.liveCost;
        state.activeRental.remainingMins = action.payload.remainingMins;
        state.activeRental.isOverLimit   = action.payload.isOverLimit;
      }
    },
    openSummary(state, action: PayloadAction<TripReceipt>) {
      state.receipt     = action.payload;
      state.showSummary = true;
      state.activeRental = null;
    },
    closeSummary(state) {
      state.showSummary = false;
      state.receipt     = null;
      state.userRating  = 0;
    },
    setUserRating(state, action: PayloadAction<number>) {
      state.userRating = action.payload;
    },
    setFinishing(state, action: PayloadAction<boolean>) {
      state.finishing = action.payload;
    },
    setFinishError(state, action: PayloadAction<string | null>) {
      state.finishError = action.payload;
    },
  },
});

export const {
  setActiveRental, updateLiveCost,
  openSummary, closeSummary,
  setUserRating, setFinishing, setFinishError,
} = rentalSlice.actions;

export const selectActiveRental  = (s: RootState) => s.rental.activeRental;
export const selectShowSummary   = (s: RootState) => s.rental.showSummary;
export const selectReceipt       = (s: RootState) => s.rental.receipt;
export const selectUserRating    = (s: RootState) => s.rental.userRating;
export const selectFinishing     = (s: RootState) => s.rental.finishing;
export const selectFinishError   = (s: RootState) => s.rental.finishError;
