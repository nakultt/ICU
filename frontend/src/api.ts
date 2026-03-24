const API_BASE = "/api";

export const getToken = () => localStorage.getItem("visicare_token");
export const setToken = (token: string) => localStorage.setItem("visicare_token", token);
export const removeToken = () => localStorage.removeItem("visicare_token");

export const getUserRole = () => localStorage.getItem("visicare_user_role");
export const setUserRole = (role: string) => localStorage.setItem("visicare_user_role", role);

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.body instanceof FormData || typeof options.body === 'string' && options.body.includes('grant_type')) ? {} : { "Content-Type": "application/json" }),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "An error occurred" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; full_name: string; role: string }) => 
      request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (params: URLSearchParams) => 
      request("/auth/login", { 
        method: "POST", 
        body: params.toString(), 
        headers: { "Content-Type": "application/x-www-form-urlencoded" } 
      }),
    me: () => request("/auth/me"),
  },

  patients: {
    list: () => request("/patients"),
    create: (data: any) => request("/patients", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    regenerateAccessCode: (id: string) => request(`/patients/${id}/access-code`, { method: "PATCH" }),
    remove: (id: string) => request(`/patients/${id}`, { method: "DELETE" }),
    updateStatus: (id: string, status: string, note: string) => 
      request(`/patients/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) }),
    link: (code: string, relationship: string) => 
      request("/patients/link", { method: "POST", body: JSON.stringify({ access_code: code, relationship }) }),
  },

  visits: {
    list: () => request("/visits"),
    getById: (id: string) => request(`/visits/${id}`),
    create: (data: any) => request("/visits", { method: "POST", body: JSON.stringify(data) }),
    approve: (id: string) => request(`/visits/${id}/approve`, { method: "PATCH" }),
    instant: (patient_id: string) => request("/visits/instant", { method: "POST", body: JSON.stringify({ patient_id }) }),
    complete: (id: string) => request(`/visits/${id}/complete`, { method: "PATCH" }),
    logMood: (visitId: string, score: number) => 
      request("/visits/mood", { method: "POST", body: JSON.stringify({ visit_id: visitId, score }) }),
  }
};
