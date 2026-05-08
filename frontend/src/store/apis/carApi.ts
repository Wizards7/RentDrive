import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Car } from "@/src/types/interface";
import type { RootState } from "@/src/store";

export const carApi = createApi({
  reducerPath: "carApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Car"],
  endpoints: (builder) => ({
    getNearbyCars: builder.query<{ cars: Car[]; count: number }, { lat: number; lon: number }>({
      query: ({ lat, lon }) => `/cars/nearby?lat=${lat}&lon=${lon}`,
      providesTags: ["Car"],
    }),
    getCarById: builder.query<{ car: Car }, string>({
      query: (id) => `/cars/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Car", id }],
    }),
  }),
});

export const { useGetNearbyCarsQuery, useGetCarByIdQuery } = carApi;
