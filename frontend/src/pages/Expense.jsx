import React from "react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import EmptyState from "../components/EmptyState";
import { addExpense, deleteExpense, getExpenses } from "../services/expense";
import { getBankAccounts } from "../services/bankAccount";

const today = new Date().toISOString().slice(0,10);
const categories=["Food","Travel","Shopping","Education","Entertainment","Medical","Bills","Other"];

export default function Expense() {
  const [items,setItems]=useState([]), [accounts,setAccounts]=useState([]), [form,setForm]=useState({category:"Food",amount:"",description:"",date:today,payment_method:"Cash",bank_account_id:""});
  const load=async()=>{try{const [x,a]=await Promise.all([getExpenses(),getBankAccounts()]);setItems(x.data);setAccounts(a.data)}catch(e){toast.error("Could not load expenses")}};
  useEffect(()=>{load()},[]);
  const submit=async e=>{e.preventDefault();try{await addExpense({...form,amount:Number(form.amount),bank_account_id:form.bank_account_id?Number(form.bank_account_id):null});setForm({category:"Food",amount:"",description:"",date:today,payment_method:"Cash",bank_account_id:""});toast.success("Expense added");load()}catch(e){toast.error(e.response?.data?.detail||"Unable to add expense")}};
  const remove=async id=>{if(!confirm("Delete this expense?"))return;try{await deleteExpense(id);toast.success("Deleted");load()}catch(e){toast.error("Delete failed")}};
  return <Layout title="Expense Management">
    <div className="form-panel"><h3>Add Expense</h3><form className="form-grid" onSubmit={submit}>
      <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Amount<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
      <label>Date<input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
      <label>Payment method<select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value,bank_account_id:""})}><option>Cash</option><option>Bank Account</option></select></label>
      {form.payment_method==="Bank Account"&&<label>Bank account<select required value={form.bank_account_id} onChange={e=>setForm({...form,bank_account_id:e.target.value})}><option value="">Select account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.bank_name} ••••{a.account_number.slice(-4)}</option>)}</select></label>}
      <label className="wide">Description<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <button className="danger">Add Expense</button>
    </form></div>
    <div className="panel"><div className="panel-head"><h3>Expense History</h3></div>
      {items.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Method</th><th></th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.date}</td><td>{x.category}</td><td className="amount-red">₹{x.amount}</td><td>{x.payment_method}</td><td><button className="link-danger" onClick={()=>remove(x.id)}>Delete</button></td></tr>)}</tbody></table></div>:<EmptyState text="No expense records yet."/>}
    </div>
  </Layout>
}
