"use client";

import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080";

export default function AdminStats() {
  const [currentUser, setCurrentUser] = useState(null);
  const [riadsEnAttente, setRiadsEnAttente] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchStats(user.id);
    }
  }, []);

  const fetchStats = async (userId) => {
    setLoading(true);
    try {
      const [resRiads, resUsers] = await Promise.all([
        fetch(`${API_BASE}/api/riads/en-attente`, { headers: { "X-User-Id": userId } }),
        fetch(`${API_BASE}/api/utilisateurs`, { headers: { "X-User-Id": userId } }),
      ]);
      if (resRiads.ok) setRiadsEnAttente(await resRiads.json());
      if (resUsers.ok) setUtilisateurs(await resUsers.json());
    } catch (e) {
      setError("Impossible de charger les données statistiques.");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    riadsEnAttente: riadsEnAttente.length,
    utilisateursActifs: utilisateurs.filter((u) => u.statut === "ACTIF").length,
    utilisateursBloques: utilisateurs.filter((u) => u.statut === "BLOQUE").length,
    proprietaires: utilisateurs.filter((u) => u.role === "PROPRIETAIRE").length,
    clients: utilisateurs.filter((u) => u.role === "CLIENT").length,
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
          📊 Tableau de Bord Statistiques
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Vue d'ensemble de l'activité de la plateforme MoroccoRiads.
        </p>
      </div>

      {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#ef4444", marginBottom: "20px", fontWeight: 500 }}>⚠️ {error}</div>}

      {/* Grid of indicators */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {[
          { icon: "⏳", label: "Riads en attente", value: stats.riadsEnAttente, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
          { icon: "✅", label: "Utilisateurs actifs", value: stats.utilisateursActifs, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { icon: "🔒", label: "Comptes bloqués", value: stats.utilisateursBloques, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
          { icon: "🏡", label: "Propriétaires", value: stats.proprietaires, color: "var(--terracotta)", bg: "rgba(176,91,59,0.1)" },
          { icon: "👤", label: "Clients", value: stats.clients, color: "var(--majorelle)", bg: "rgba(88,86,214,0.1)" },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: "28px", textAlign: "center", background: stat.bg, border: `1px solid ${stat.color}30` }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{stat.icon}</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: stat.color, fontFamily: "Playfair Display, serif", lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "8px", fontWeight: 500 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Riads récents en attente */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
            ⏳ Riads à traiter
          </h3>
          {riadsEnAttente.slice(0, 5).map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{r.nom}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{r.ville}</p>
              </div>
            </div>
          ))}
          {riadsEnAttente.length === 0 && <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>Aucun riad en attente.</p>}
        </div>

        {/* Derniers utilisateurs */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
            👥 Derniers Utilisateurs
          </h3>
          {utilisateurs.slice(0, 5).map((u) => (
            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, var(--terracotta), var(--majorelle))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.8rem" }}>
                  {u.prenom?.[0]}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>{u.prenom} {u.nom}</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{u.role}</p>
                </div>
              </div>
              <span style={{
                padding: "2px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600,
                color: u.statut === "ACTIF" ? "#10b981" : "#ef4444",
                background: u.statut === "ACTIF" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"
              }}>
                {u.statut}
              </span>
            </div>
          ))}
          {utilisateurs.length === 0 && <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>Aucun utilisateur.</p>}
        </div>
      </div>
    </div>
  );
}
