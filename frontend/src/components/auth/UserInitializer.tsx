"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/src/hooks/redux";
import { useGetMeQuery } from "@/src/store/apis/userApi";
import { updateUser, selectIsAuthenticated, selectToken } from "@/src/store/slices/authSlice";

export function UserInitializer() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const token = useAppSelector(selectToken);

  // We skip if no token or if we already have the user (optional, but good for refresh)
  const { data, isSuccess } = useGetMeQuery(undefined, {
    skip: !isAuthenticated || !token,
  });

  useEffect(() => {
    if (isSuccess && data?.user) {
      // Cast to AuthUser if needed, or ensure userApi types match
      dispatch(updateUser({
        id: data.user.id,
        phone: data.user.phone,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        tajikPassportVerified: data.user.tajikPassportVerified,
        driverLicenseVerified: data.user.driverLicenseVerified,
      }));
    }
  }, [isSuccess, data, dispatch]);

  return null;
}
