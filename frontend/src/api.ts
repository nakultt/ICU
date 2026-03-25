const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://icu-r1j0.onrender.com/api" : "/api");

export const getToken = () => localStorage.getItem("visicare_token");
export const setToken = (token: string) => localStorage.setItem("visicare_token", token);
export const removeToken = () => localStorage.removeItem("visicare_token");

export const getUserRole = () => localStorage.getItem("visicare_user_role");
export const setUserRole = (role: string) => localStorage.setItem("visicare_user_role", role);
export const getUserName = () => localStorage.getItem("visicare_user_name");
export const setUserName = (name: string) => localStorage.setItem("visicare_user_name", name);

type JsonObject = Record<string, unknown>;

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
    getById: (id: string) => request(`/patients/${id}`),
    getMonitoringLogs: (id: string) => request(`/patients/${id}/monitoring-logs`),
    create: (data: JsonObject) => request("/patients", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: JsonObject) => request(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
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
    create: (data: JsonObject) => request("/visits", { method: "POST", body: JSON.stringify(data) }),
    approve: (id: string) => request(`/visits/${id}/approve`, { method: "PATCH" }),
    instant: (patient_id: string) => request("/visits/instant", { method: "POST", body: JSON.stringify({ patient_id }) }),
    complete: (id: string) => request(`/visits/${id}/complete`, { method: "PATCH" }),
    logMood: (visitId: string, score: number) => 
      request("/visits/mood", { method: "POST", body: JSON.stringify({ visit_id: visitId, score }) }),
  },

  ai: {
    getSummary: (patientId: string) => request(`/ai/summary/${patientId}`),
    chat: (patientId: string, message: string, history: any[] = []) => 
      request(`/ai/chat/${patientId}`, { method: "POST", body: JSON.stringify({ message, history }) }),
    indexStats: (patientId: string) => request(`/ai/index/${patientId}`, { method: "POST" })
  }
};
