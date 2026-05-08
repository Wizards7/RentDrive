import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "./slices/authSlice";
import { carSlice } from "./slices/carSlice";
import { mapSlice } from "./slices/mapSlice";
import { rentalSlice } from "./slices/rentalSlice";
import { historySlice } from "./slices/historySlice";
import { carApi } from "./apis/carApi";
import { userApi } from "./apis/userApi";
import { rentalApi } from "./apis/rentalApi";

export const store = configureStore({
  reducer: {
    auth:    authSlice.reducer,
    car:     carSlice.reducer,
    map:     mapSlice.reducer,
    rental:  rentalSlice.reducer,
    history: historySlice.reducer,
    [carApi.reducerPath]:    carApi.reducer,
    [userApi.reducerPath]:   userApi.reducer,
    [rentalApi.reducerPath]: rentalApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      carApi.middleware,
      userApi.middleware,
      rentalApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
