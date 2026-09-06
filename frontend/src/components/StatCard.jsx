
import React from "react";
export default function StatCard({ title, value, icon, tone = "blue", subtitle }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{title}</p>
        <h2>{value}</h2>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  );
}
