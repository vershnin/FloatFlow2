import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { SecureStorage, isTokenExpired } from "../lib/security";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = SecureStorage.getItem("ff_token");
    if (token) {
      // Check if token is expired before using it
      if (isTokenExpired(token)) {
        SecureStorage.removeItem("ff_token");
        SecureStorage.removeItem("ff_user");
        window.location.href = "/login";
        toast.error("Session expired. Please sign in again.");
        return Promise.reject(new Error("Token expired"));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success: boolean; message: string }>) => {
    if (error.response) {
      if (error.response.status === 401) {
        SecureStorage.removeItem("ff_token");
        SecureStorage.removeItem("ff_user");
        window.location.href = "/login";
        toast.error("Session expired. Please sign in again.");
        return Promise.reject(error);
      }
      const message = error.response.data?.message || "An error occurred";
      toast.error(message);
    } else if (error.request) {
      toast.error("Cannot reach server. Check your connection.");
    } else {
      toast.error("An unexpected error occurred.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
