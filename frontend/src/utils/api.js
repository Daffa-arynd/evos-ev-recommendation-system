// EVOS — API Client Utility (Extended)
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const recommendVehicles = (p) => request("/recommend", { method: "POST", body: JSON.stringify(p) });
export const fetchVehicles     = (p = {}) => request(`/vehicles?${new URLSearchParams(p)}`);
export const fetchVehicle      = (id) => request(`/vehicles/${id}`);
export const searchVehicles    = (q) => request(`/vehicles/search?q=${q}`);
export const fetchClusters     = () => request("/clusters");
export const fetchHealth       = () => request("/health");
export const submitFeedback    = (p) => request("/recommend/feedback", { method: "POST", body: JSON.stringify(p) });
export const fetchSimilar      = (id, k = 5) => request(`/recommend/similar/${id}?top_k=${k}`);
export const fetchStatistics   = () => request("/statistics/overview");
export const fetchPCA3D        = () => request("/statistics/pca3d");
export const fetchElbow = () => request("/statistics/elbow");