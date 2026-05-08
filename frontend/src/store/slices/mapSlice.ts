import { createSlice, createSelector, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/src/store";

type CarClass = "ECONOMY" | "COMFORT" | "CROSSOVER";
type CarStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE";

export interface MapCar {
  id: string;
  model: string;
  carClass: CarClass;
  status: CarStatus;
  latitude: number;
  longitude: number;
  fuelLevel: number;
  features: string[];
  imageUrl: string | null;
  distanceMeters: number;
  tariff?: {
    perMinDriving: number;
    package3h: number;
    package6h: number;
    package24h: number;
  };
}

interface UserLocation {
  lat: number;
  lon: number;
}

interface MapState {
  userLocation: UserLocation | null;
  visibleCars: MapCar[];
  selectedCarId: string | null;
  classFilter: CarClass | null;
  locationPermission: "granted" | "denied" | "prompt" | "unknown";
}

const initialState: MapState = {
  userLocation: null,
  visibleCars: [],
  selectedCarId: null,
  classFilter: null,
  locationPermission: "unknown",
};

export const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setUserLocation(state, action: PayloadAction<UserLocation>) {
      state.userLocation = action.payload;
    },
    setVisibleCars(state, action: PayloadAction<MapCar[]>) {
      state.visibleCars = action.payload;
    },
    setSelectedCar(state, action: PayloadAction<string | null>) {
      state.selectedCarId = action.payload;
    },
    setClassFilter(state, action: PayloadAction<CarClass | null>) {
      state.classFilter = action.payload;
    },
    setLocationPermission(state, action: PayloadAction<MapState["locationPermission"]>) {
      state.locationPermission = action.payload;
    },
  },
});

export const { setUserLocation, setVisibleCars, setSelectedCar, setClassFilter, setLocationPermission } =
  mapSlice.actions;

const selectMapState = (state: RootState) => state.map;

export const selectUserLocation = createSelector(selectMapState, (m) => m.userLocation);
export const selectVisibleCars = createSelector(selectMapState, (m) => m.visibleCars);
export const selectSelectedCarId = createSelector(selectMapState, (m) => m.selectedCarId);
export const selectClassFilter = createSelector(selectMapState, (m) => m.classFilter);
export const selectLocationPermission = createSelector(selectMapState, (m) => m.locationPermission);
export const selectSelectedCar = createSelector(
  selectMapState,
  (m) => m.visibleCars.find((c) => c.id === m.selectedCarId) ?? null
);
