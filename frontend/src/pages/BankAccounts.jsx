import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import { addBankAccount, deleteBankAccount, getBankAccounts } from "../services/bankAccount";

const money = v => `₹${Number(v || 0).toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}`;

export default function BankAccounts(){
  const [items,setItems]=useState([]);
  const [form,setForm]=useState({bank_name:"",account_number:"",account_type:"Savings",balance:""});
  const load=()=>getBankAccounts().then(r=>setItems(r.data)).catch(()=>toast.error("Could not load accounts"));
  useEffect(()=>{load()},[]);
  const submit=async e=>{
    e.preventDefault();
    try{
      await addBankAccount({...form,balance:Number(form.balance||0)});
      toast.success("Bank account added");
      setForm({bank_name:"",account_number:"",account_type:"Savings",balance:""});
      load();
    }catch(e){toast.error(e.response?.data?.detail||"Unable to add account")}
  };
  const remove=async id=>{
    if(!confirm("Delete this bank account?"))return;
    try{await deleteBankAccount(id);toast.success("Account removed");load()}
    catch(e){toast.error(e.response?.data?.detail||"Cannot delete account")}
  };
  return <Layout title="Bank Accounts">
    <section className="statement-hero">
      <div>
        <span className="eyebrow">CONNECTED ACCOUNTS</span>
        <h2>Manage your bank accounts</h2>
        <p>Link accounts to make your BudgetBuddy transactions easier to review in your financial records.</p>
      </div>
    </section>
    <div className="form-panel">
      <h3>Add bank account</h3>
      <p className="muted" style={{margin:"5px 0 18px"}}>Only the last four digits are displayed after an account is saved.</p>
      <form className="form-grid" onSubmit={submit}>
        <label>Bank name<input required value={form.bank_name} onChange={e=>setForm({...form,bank_name:e.target.value})} placeholder="State Bank of India" /></label>
        <label>Account number<input required minLength="4" value={form.account_number} onChange={e=>setForm({...form,account_number:e.target.value})} placeholder="Account number" /></label>
        <label>Account type<select value={form.account_type} onChange={e=>setForm({...form,account_type:e.target.value})}><option>Savings</option><option>Current</option></select></label>
        <label>Current balance<input type="number" min="0" step="0.01" value={form.balance} onChange={e=>setForm({...form,balance:e.target.value})} placeholder="0.00" /></label>
        <button className="primary" type="submit">Add account</button>
      </form>
    </div>
    <div className="panel-head"><h3>Linked accounts</h3><span className="statement-count">{items.length} account{items.length===1?"":"s"}</span></div>
    <div className="account-grid">
      {items.map(a=><div className="account-card" key={a.id}>
        <div><span className="eyebrow">BANK ACCOUNT</span><h3 style={{margin:"5px 0"}}>{a.bank_name}</h3><p className="muted">{a.account_type} ·•••• {a.account_number.slice(-4)}</p></div>
        <strong>{money(a.balance)}</strong>
        <button className="link-danger" onClick={()=>remove(a.id)}>Remove account</button>
      </div>)}
      {!items.length && <div className="panel empty" style={{gridColumn:"1/-1"}}>No bank accounts linked yet.</div>}
    </div>
  </Layout>
}
