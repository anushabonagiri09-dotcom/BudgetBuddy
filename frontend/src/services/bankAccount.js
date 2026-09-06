import api from "../api";
export const getBankAccounts = () => api.get("/bank-account/");
export const addBankAccount = (data) => api.post("/bank-account/", data);
export const deleteBankAccount = (id) => api.delete(`/bank-account/${id}`);
