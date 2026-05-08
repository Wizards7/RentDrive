import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyPhoneRequest,
} from "@/src/types/interface";

export interface MeUser extends User {
  totalRentals: number;
  completedRentals: number;
  discountPct: number;
  discountTier: string;
  isVip: boolean;
  vipDiscount: number;
  rating: number;
}
import type { RootState } from "@/src/store";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    verifyPhone: builder.mutation<{ message: string }, VerifyPhoneRequest>({
      query: (body) => ({ url: "/auth/verify-phone", method: "POST", body }),
    }),
    getMe: builder.query<{ user: MeUser }, void>({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
    updateMe: builder.mutation<{ user: User }, { firstName?: string; lastName?: string }>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      invalidatesTags: ["User"],
    }),
    submitDriverLicense: builder.mutation<{ message: string }, { licenseNumber: string }>({
      query: (body) => ({ url: "/users/me/driver-license", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    submitPassport: builder.mutation<{ message: string }, { passportNumber: string }>({
      query: (body) => ({ url: "/users/me/passport", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyPhoneMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useSubmitDriverLicenseMutation,
  useSubmitPassportMutation,
} = userApi;
