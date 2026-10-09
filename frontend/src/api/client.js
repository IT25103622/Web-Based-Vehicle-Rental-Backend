const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
// Backend image endpoints (vehicle-images/{id}/content, etc.) already return
// paths starting with "/api/...", so building a URL for them needs the bare
// origin, not BASE_URL (which already ends in "/api" and would double it up).
const ORIGIN = BASE_URL.replace(/\/api\/?$/, "");

function getToken() {
  return localStorage.getItem("vr_token");
}

async function request(path, { method = "GET", body, isForm = false, params } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  if (res.status === 401) {
    localStorage.removeItem("vr_token");
    localStorage.removeItem("vr_user");
    if (!path.startsWith("/auth/")) {
      window.location.href = "/login";
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || (typeof data === "string" ? data : null) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  postForm: (path, formData) => request(path, { method: "POST", body: formData, isForm: true }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),
  imageUrl: (path) => `${ORIGIN}${path}`,
};

export default api;