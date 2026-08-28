"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ClientLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
