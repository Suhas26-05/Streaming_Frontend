import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

export const signUpUser = async (payload) => {
  // The API's UserCreate schema uses `name`; the form uses `username` as its
  // display label.
  const { username, ...signupData } = payload;
  const { data } = await api.post("/signup", { ...signupData, name: username });
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await api.post("/login", payload);
  return data;
};

export const logoutUser = async ({ session_token: sessionToken, isAdmin = false }) => {
  const { data } = await api.post(isAdmin ? "/admin/logout" : "/logout", {
    session_token: sessionToken
  });
  return data;
};

export const getProfiles = async (userId) => {
  const { data } = await api.get(`/users/${encodeURIComponent(userId)}/profiles`);
  return data;
};

export const createProfile = async (userId, payload) => {
  const { data } = await api.post(`/users/${encodeURIComponent(userId)}/profiles`, payload);
  return data;
};

export const updateProfile = async (userId, profileId, payload) => {
  const { data } = await api.put(
    `/users/${encodeURIComponent(userId)}/profiles/${profileId}`,
    payload
  );
  return data;
};

export const deleteProfile = async (userId, profileId) => {
  const { data } = await api.delete(`/users/${encodeURIComponent(userId)}/profiles/${profileId}`);
  return data;
};

export const selectProfile = async (userId, profileId) => {
  const { data } = await api.post(
    `/users/${encodeURIComponent(userId)}/profiles/select`,
    { profile_id: profileId }
  );
  return data;
};

export default api;
