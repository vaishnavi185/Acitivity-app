
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

// Common fetch function
export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item?.msg).filter(Boolean).join(". ")
      : typeof detail === "string"
        ? detail
        : "Something went wrong";

    if (
      response.status === 401 &&
      token &&
      !endpoint.startsWith("/auth/login") &&
      !endpoint.startsWith("/auth/register")
    ) {
      localStorage.removeItem("token");
      window.dispatchEvent(new CustomEvent("app:session-expired"));
    }

    throw new ApiError(message, response.status);
  }

  return data;
}

// Register service
export function registerUser(payload: {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  location?: string | null;
}) {
  return authFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Login service
export async function loginUser(payload: {
  email: string;
  password: string;
}) {
  const data = await authFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (typeof data?.access_token !== "string" || !data.access_token) {
    throw new Error("Login response did not include an access token");
  }

  localStorage.setItem("token", data.access_token);
  return data;
}

// Get current logged-in user
export function getCurrentUser() {
  return authFetch("/auth/me");
}

// Logout helper
export function logoutUser() {
  localStorage.removeItem("token");
}
