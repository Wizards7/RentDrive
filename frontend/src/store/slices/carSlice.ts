import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/src/store";

type CarClass = "ECONOMY" | "COMFORT" | "CROSSOVER";

interface CarFilters {
  carClass: CarClass | null;
  maxDistanceMeters: number | null;
}

interface CarState {
  filters: CarFilters;
  selectedCarId: string | null;
}

const initialState: CarState = {
  filters: {
    carClass: null,
    maxDistanceMeters: null,
  },
  selectedCarId: null,
};

export const carSlice = createSlice({
  name: "car",
  initialState,
  reducers: {
    setCarClassFilter(state, action: PayloadAction<CarClass | null>) {
      state.filters.carClass = action.payload;
    },
    setMaxDistanceFilter(state, action: PayloadAction<number | null>) {
      state.filters.maxDistanceMeters = action.payload;
    },
    clearFilters(state) {
      state.filters = initialState.filters;
    },
    selectCar(state, action: PayloadAction<string | null>) {
      state.selectedCarId = action.payload;
    },
  },
});

export const { setCarClassFilter, setMaxDistanceFilter, clearFilters, selectCar } =
  carSlice.actions;

const selectCarState = (state: RootState) => state.car;

export const selectCarFilters = createSelector(
  selectCarState,
  (car) => car.filters
);

export const selectSelectedCarId = createSelector(
  selectCarState,
  (car) => car.selectedCarId
);
