export function saveToken(token: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem("store_token", token);

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `auth_token=${token}; path=/; expires=${expires}; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const localToken = localStorage.getItem("store_token");
  if (localToken) return localToken;

  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1] ?? null
  );
}

export function clearToken() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("store_token");
  document.cookie =
    "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
}
