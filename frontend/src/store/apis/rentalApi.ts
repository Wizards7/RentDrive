import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Rental, HistoryRental, CostBreakdown, RentalPackage } from "@/src/types/interface";
import type { RootState } from "@/src/store";

interface RentalHistoryResponse {
  rentals: HistoryRental[];
  total: number;
  page: number;
  limit: number;
}

export const rentalApi = createApi({
  reducerPath: "rentalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Rental"],
  endpoints: (builder) => ({
    getActiveRental: builder.query<{ rental: Rental | null }, void>({
      query: () => "/rentals/active",
      providesTags: ["Rental"],
    }),
    getRentalHistory: builder.query<RentalHistoryResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) =>
        `/rentals/history?page=${page}&limit=${limit}`,
      providesTags: ["Rental"],
    }),
    startRental: builder.mutation<
      { rental: Rental },
      { carId: string; latitude: number; longitude: number; package?: RentalPackage }
    >({
      query: (body) => ({ url: "/rentals/start", method: "POST", body }),
      invalidatesTags: ["Rental"],
    }),
    endRental: builder.mutation<
      { rental: Rental; cost: CostBreakdown },
      {
        rentalId: string;
        latitude: number;
        longitude: number;
        drivingMinutes: number;
        waitingMinutes: number;
        distanceKm: number;
      }
    >({
      query: (body) => ({ url: "/rentals/end", method: "POST", body }),
      invalidatesTags: ["Rental"],
    }),
  }),
});

export const {
  useGetActiveRentalQuery,
  useGetRentalHistoryQuery,
  useStartRentalMutation,
  useEndRentalMutation,
} = rentalApi;
