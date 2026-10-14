"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, getCurrentUser, logoutUser } from "@/service/AuthService";
import { Toast } from "./AuthToast";
import { confirmAction } from "@/src/lib/confirmAction";

type ToastType = "success" | "error";
type AuthStatus = "checking" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  notify: (message: string, type?: ToastType) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return auth;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );

  const notify = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
  }, []);

  const logout = useCallback(async () => {
    const confirmed = await confirmAction({
      title: "Log out?",
      text: "Are you sure you want to log out?",
      confirmButtonText: "Log out",
    });
    if (!confirmed) return;

    logoutUser();
    setStatus("unauthenticated");
    notify("You have been logged out.", "success");
    router.replace("/login");
  }, [notify, router]);

  useEffect(() => {
    let active = true;
    const isAuthPage = pathname === "/login" || pathname === "/register";
    const token = localStorage.getItem("token");

    setStatus("checking");

    if (!token) {
      setStatus("unauthenticated");
      if (!isAuthPage) {
        router.replace("/login");
      }
      return () => {
        active = false;
      };
    }

    getCurrentUser()
      .then(() => {
        if (!active) return;
        setStatus("authenticated");
        if (isAuthPage) {
          router.replace("/dashboard");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatus("unauthenticated");
        if (!(error instanceof ApiError && error.status === 401)) {
          notify("Unable to verify your session. Please sign in again.", "error");
        }
        if (!isAuthPage) {
          router.replace("/login");
        }
      });

    return () => {
      active = false;
    };
  }, [pathname, router, notify]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setStatus("unauthenticated");
      notify("Your session has expired. Please log in again.", "error");
      if (pathname !== "/login" && pathname !== "/register") {
        router.replace("/login");
      }
    };

    window.addEventListener("app:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("app:session-expired", handleSessionExpired);
  }, [pathname, router, notify]);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const blockContent =
    (!isAuthPage && status !== "authenticated") ||
    (isAuthPage && status === "authenticated");
  const contextValue = useMemo(() => ({ notify, logout }), [notify, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {blockContent ? (
        <main
          className="min-h-screen bg-[#FAF8F5]"
          aria-label="Checking authentication"
        />
      ) : (
        children
      )}
      {toast && (
        <Toast
          key={`${toast.type}:${toast.message}`}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AuthContext.Provider>
  );
}
