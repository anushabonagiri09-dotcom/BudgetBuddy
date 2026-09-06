import api from "../api";
export const getGoals = () => api.get("/goals/");
export const getAvailableBalance = () => api.get("/goals/available-balance");
export const addGoal = (data) => api.post("/goals/", data);
export const contributeGoal = (id, amount) => api.patch(`/goals/${id}/contribute`, { amount });
export const deleteGoal = (id) => api.delete(`/goals/${id}`);
