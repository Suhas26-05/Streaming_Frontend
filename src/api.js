import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json"
  }
});

export const signUpUser = async (payload) => {
  const { data } = await api.post("/signup", payload);
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await api.post("/login", payload);
  return data;
};

export const logoutUser = async (session) => {
  const payload = session.session_id != null
    ? { session_id: session.session_id }
    : { session_token: session.session_token };
  const { data } = await api.post("/logout", payload);
  return data;
};

export default api;
