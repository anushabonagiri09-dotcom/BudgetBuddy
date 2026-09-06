import React from "react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import EmptyState from "../components/EmptyState";
import { addIncome, deleteIncome, getIncome } from "../services/income";
import { getBankAccounts } from "../services/bankAccount";

const today = new Date().toISOString().slice(0,10);

export default function Income() {
  const [items,setItems]=useState([]), [accounts,setAccounts]=useState([]), [form,setForm]=useState({source:"",amount:"",description:"",date:today,payment_method:"Cash",bank_account_id:""});
  const load=async()=>{try{const [i,a]=await Promise.all([getIncome(),getBankAccounts()]);setItems(i.data);setAccounts(a.data)}catch(e){toast.error("Could not load income")}};
  useEffect(()=>{load()},[]);
  const submit=async e=>{e.preventDefault();try{await addIncome({...form,amount:Number(form.amount),bank_account_id:form.bank_account_id?Number(form.bank_account_id):null});setForm({source:"",amount:"",description:"",date:today,payment_method:"Cash",bank_account_id:""});toast.success("Income added");load()}catch(e){toast.error(e.response?.data?.detail||"Unable to add income")}};
  const remove=async id=>{if(!confirm("Delete this income?"))return;try{await deleteIncome(id);toast.success("Deleted");load()}catch(e){toast.error("Delete failed")}};
  return <Layout title="Income Management">
    <div className="form-panel"><h3>Add Income</h3><form className="form-grid" onSubmit={submit}>
      <label>Source<input required value={form.source} onChange={e=>setForm({...form,source:e.target.value})} placeholder="Salary, scholarship..." /></label>
      <label>Amount<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
      <label>Date<input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
      <label>Payment method<select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value,bank_account_id:""})}><option>Cash</option><option>Bank Account</option></select></label>
      {form.payment_method==="Bank Account"&&<label>Bank account<select required value={form.bank_account_id} onChange={e=>setForm({...form,bank_account_id:e.target.value})}><option value="">Select account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.bank_name} ••••{a.account_number.slice(-4)}</option>)}</select></label>}
      <label className="wide">Description<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <button className="primary">Add Income</button>
    </form></div>
    <div className="panel"><div className="panel-head"><h3>Income History</h3></div>
      {items.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Source</th><th>Amount</th><th>Method</th><th></th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.date}</td><td>{x.source}</td><td className="amount-green">₹{x.amount}</td><td>{x.payment_method}</td><td><button className="link-danger" onClick={()=>remove(x.id)}>Delete</button></td></tr>)}</tbody></table></div>:<EmptyState text="No income records yet."/>}
    </div>
  </Layout>
}
