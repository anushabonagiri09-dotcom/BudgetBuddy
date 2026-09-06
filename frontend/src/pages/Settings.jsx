import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import { deleteAccount } from "../services/auth";
import { useAuth } from "../context/AuthContext";

export default function Settings(){
 const [password,setPassword]=useState("");const {logout}=useAuth();const navigate=useNavigate();
 const remove=async()=>{if(!password)return toast.error("Enter your password");if(!confirm("Permanently delete your account and all data?"))return;try{await deleteAccount(password);logout();navigate("/login");toast.success("Account deleted")}catch(e){toast.error(e.response?.data?.detail||"Unable to delete account")}};
 return <Layout title="Settings"><div className="panel danger-panel"><h3>Delete Account</h3><p>This permanently removes your BudgetBuddy data.</p><input type="password" placeholder="Current password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="danger" onClick={remove}>Delete my account</button></div></Layout>
}
