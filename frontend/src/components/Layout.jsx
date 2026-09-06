import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children, title }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Navbar />
        {title && <h2 className="page-title">{title}</h2>}
        {children}
      </main>
    </div>
  );
}
