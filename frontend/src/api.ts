const API_BASE = "http://localhost:8000/api";

export const getUserId = () => localStorage.getItem("visicare_user_id");
export const setUserId = (id: string) => localStorage.setItem("visicare_user_id", id);
export const getUserRole = () => localStorage.getItem("visicare_user_role");
export const setUserRole = (role: string) => localStorage.setItem("visicare_user_role", role);

async function request(path: string, options: RequestInit = {}) {
  const userId = getUserId();
  const headers = {
    "Content-Type": "application/json",
    ...(userId ? { "X-User-ID": userId } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "An error occurred" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  identify: (data: { email: string; full_name: string; role: string }) => 
    request("/auth/identify", { method: "POST", body: JSON.stringify(data) }),
  
  me: () => request("/auth/me"),

  patients: {
    list: () => request("/patients"),
    create: (data: any) => request("/patients", { method: "POST", body: JSON.stringify(data) }),
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
    logMood: (visitId: string, score: number) => 
      request("/visits/mood", { method: "POST", body: JSON.stringify({ visit_id: visitId, score }) }),
  }
};
