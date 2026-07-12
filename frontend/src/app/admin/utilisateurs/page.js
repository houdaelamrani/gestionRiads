"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8080";

const statutUserBadge = {
  ACTIF: { label: "Actif", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  BLOQUE: { label: "Bloqué", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

export default function AdminUtilisateurs() {
  const [currentUser, setCurrentUser] = useState(null);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUtilisateurs = useCallback(async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/utilisateurs`, {
        headers: { "X-User-Id": userId },
      });
      if (!res.ok) throw new Error("Impossible de charger les utilisateurs.");
      const data = await res.json();
      setUtilisateurs(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchUtilisateurs(user.id);
    }
  }, [fetchUtilisateurs]);

  const handleToggleStatut = async (utilisateur) => {
    const newStatut = utilisateur.statut === "ACTIF" ? "BLOQUE" : "ACTIF";
    const action = newStatut === "BLOQUE" ? "bloquer" : "activer";
    if (!confirm(`Voulez-vous ${action} le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`)) return;

    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `${API_BASE}/api/utilisateurs/${utilisateur.id}/statut?statut=${newStatut}`,
        { method: "PUT", headers: { "X-User-Id": currentUser.id } }
      );
      if (!res.ok) throw new Error("Impossible de modifier ce compte.");
      setSuccess(`Compte ${action === "bloquer" ? "bloqué" : "activé"} avec succès.`);
      fetchUtilisateurs(currentUser.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
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
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
          👥 Gestion des Utilisateurs
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Gérez les comptes clients et propriétaires de la plateforme.
        </p>
      </div>

      {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#ef4444", marginBottom: "20px", fontWeight: 500 }}>⚠️ {error}</div>}
      {success && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#10b981", marginBottom: "20px", fontWeight: 500 }}>✅ {success}</div>}

      {utilisateurs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "1.1rem" }}>Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                {["Utilisateur", "Email", "Rôle", "Statut", "Action"].map((col) => (
                  <th key={col} style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((user, i) => {
                const badge = statutUserBadge[user.statut] || { label: user.statut, color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
                const isAdmin = user.role === "ADMIN";
                return (
                  <tr
                    key={user.id}
                    style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"; }}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, var(--terracotta), var(--majorelle))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                          {user.prenom?.[0]}{user.nom?.[0]}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                          {user.prenom} {user.nom}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>{user.email}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        padding: "3px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600,
                        background: user.role === "ADMIN" ? "rgba(124,58,237,0.15)" : user.role === "PROPRIETAIRE" ? "rgba(176,91,59,0.15)" : "rgba(59,130,246,0.15)",
                        color: user.role === "ADMIN" ? "#7c3aed" : user.role === "PROPRIETAIRE" ? "var(--terracotta)" : "#3b82f6",
                      }}>
                        {user.role === "PROPRIETAIRE" ? "Propriétaire" : user.role}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ padding: "3px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600, color: badge.color, background: badge.bg }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      {isAdmin ? (
                        <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontStyle: "italic" }}>—</span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatut(user)}
                          disabled={actionLoading}
                          style={{
                            padding: "7px 16px", borderRadius: "8px", border: "1px solid", cursor: "pointer",
                            fontSize: "0.82rem", fontWeight: 500, transition: "all 0.2s",
                            borderColor: user.statut === "ACTIF" ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)",
                            background: user.statut === "ACTIF" ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)",
                            color: user.statut === "ACTIF" ? "#ef4444" : "#10b981",
                          }}
                        >
                          {user.statut === "ACTIF" ? "🔒 Bloquer" : "🔓 Activer"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
