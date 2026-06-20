import axios from "axios";

/**
 * API client — uses relative base URL so all requests go through the
 * Next.js rewrite proxy (/api/* → http://localhost:5175/api/*).
 *
 * This avoids CORS issues and HTTP/HTTPS mismatches in development.
 * In production, set API_URL in .env to point at the real backend host.
 */
const api = axios.create({
  baseURL: "",          // relative: browser calls /api/... → proxied by Next.js
  headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 → clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
