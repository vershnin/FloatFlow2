import axios, { AxiosError } from "axios";
import { toast } from "sonner";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ff_token");
    if (token) {
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
        localStorage.removeItem("ff_token");
        localStorage.removeItem("ff_user");
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
