import React from "react";
import { useEffect,useState } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import { addGoal, contributeGoal, deleteGoal, getGoals, getAvailableBalance } from "../services/goals";
import { FaBullseye, FaPlus, FaPiggyBank } from "react-icons/fa";

export default function Goals(){
 const [items,setItems]=useState([]),[form,setForm]=useState({title:"",target_amount:"",target_date:""}),[amounts,setAmounts]=useState({}),[available,setAvailable]=useState(0);
 const load=async()=>{try{const [g,b]=await Promise.all([getGoals(),getAvailableBalance()]);setItems(g.data);setAvailable(Number(b.data.available_balance||0))}catch(e){toast.error("Could not load savings goals")}};
 useEffect(()=>{load()},[]);
 const submit=async e=>{e.preventDefault();try{await addGoal({...form,target_amount:Number(form.target_amount),current_amount:0,target_date:form.target_date||null});toast.success("Goal created");setForm({title:"",target_amount:"",target_date:""});load()}catch(e){toast.error(e.response?.data?.detail||"Unable to create goal")}};
 const contribute=async id=>{const amount=Number(amounts[id]);if(!amount||amount<=0)return toast.error("Enter a positive contribution");if(amount>available)return toast.error(`Available balance is only ₹${available.toFixed(2)}`);try{await contributeGoal(id,amount);toast.success("Savings added — available balance reduced");setAmounts({...amounts,[id]:""});load()}catch(e){toast.error(e.response?.data?.detail||"Unable to contribute")}};
 return <Layout title="Savings Goals">
  <div className="stats-grid"><div className="stat-card green"><div className="stat-icon"><FaPiggyBank /></div><div><p>Available to Save</p><h2>₹{available.toLocaleString("en-IN",{maximumFractionDigits:2})}</h2><small>Income − Expenses − Existing Savings</small></div></div></div>
  <div className="form-panel"><div className="panel-head"><div><span className="eyebrow">SAVINGS PLANNING</span><h3><FaBullseye /> Create a Goal</h3><p className="muted">Set a target and watch your savings progress in real time.</p></div></div><form className="form-grid" onSubmit={submit}>
   <label>Goal title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="New laptop, emergency fund..." /></label>
   <label>Target amount<input required type="number" min="0.01" step="0.01" value={form.target_amount} onChange={e=>setForm({...form,target_amount:e.target.value})}/></label>
   <label>Target date<input type="date" value={form.target_date} onChange={e=>setForm({...form,target_date:e.target.value})}/></label><button className="primary">Create Goal</button>
  </form><p className="muted">Goal titles must be unique. Contributions are deducted from your available balance.</p></div>
  <div className="goal-grid">{items.map(g=>{const pct=Math.min(100,(g.current_amount/g.target_amount)*100);const complete=g.status==="completed"||pct>=100;return <div className="goal-card" key={g.id}><div className="panel-head"><div><span className="eyebrow">SAVINGS GOAL</span><h3>{g.title}</h3></div><span className={complete?"status success":"status"}>{complete?"completed":g.status}</span></div><div className="goal-amount">₹{g.current_amount.toFixed(2)} <small>saved of ₹{g.target_amount.toFixed(2)}</small></div><div className="goal-progress-head"><span>Progress</span><strong>{pct.toFixed(1)}%</strong></div><div className="goal-progress-track"><span className={complete?"goal-progress-fill complete":"goal-progress-fill"} style={{width:`${pct}%`}}/></div><div className="goal-meta"><span>{complete?"Target reached":"Keep going"}</span><span>{g.target_date?`Target ${g.target_date}`:"No target date"}</span></div>{!complete&&<div className="inline-form"><input type="number" min="0.01" max={available} step="0.01" placeholder="Contribution" value={amounts[g.id]||""} onChange={e=>setAmounts({...amounts,[g.id]:e.target.value})}/><button className="primary" onClick={()=>contribute(g.id)}><FaPlus /> Add</button></div>}<button className="link-danger" onClick={async()=>{if(confirm("Delete this savings goal?")){await deleteGoal(g.id);load()}}}>Delete Goal</button></div>})}</div>
 </Layout>
}
