import api from "../api";
export const getMe = () => api.get("/auth/me");
export const deleteAccount = (password) => api.delete("/auth/account", { data: { password } });
