"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function ClientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "CLIENT") {
      if (user.role === "PROPRIETAIRE") router.push("/proprietaire/riads");
      else if (user.role === "ADMIN") router.push("/admin/riads");
      else router.push("/");
      return;
    }
    setCurrentUser(user);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <nav className="navbar" style={{ position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" className="nav-logo">
          Morocco<span>Riads</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/client/catalogue"
            className={`btn ${pathname === "/client/catalogue" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 18px", fontSize: "0.85rem" }}
          >
            🏡 Catalogue
          </Link>
          <Link
            href="/client/reservations"
            className={`btn ${pathname === "/client/reservations" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 18px", fontSize: "0.85rem" }}
          >
            📋 Mes Réservations
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            👤 <strong style={{ color: "var(--terracotta)" }}>{currentUser?.prenom}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ padding: "7px 14px", fontSize: "0.82rem", border: "1px solid var(--border)" }}
          >
            Déconnexion
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
