"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8080";

const statutRiadBadge = {
  EN_ATTENTE: { label: "En attente", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  VALIDE: { label: "Validé", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  REJETE: { label: "Rejeté", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

export default function AdminRiads() {
  const [currentUser, setCurrentUser] = useState(null);
  const [riadsEnAttente, setRiadsEnAttente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchRiadsEnAttente = useCallback(async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/riads/en-attente`, {
        headers: { "X-User-Id": userId },
      });
      if (!res.ok) throw new Error("Impossible de charger les riads en attente.");
      const data = await res.json();
      setRiadsEnAttente(data);
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
      fetchRiadsEnAttente(user.id);
    }
  }, [fetchRiadsEnAttente]);

  const handleValiderRiad = async (riadId) => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riadId}/valider`, {
        method: "PUT",
        headers: { "X-User-Id": currentUser.id },
      });
      if (!res.ok) throw new Error("Impossible de valider ce riad.");
      setSuccess("Riad validé avec succès !");
      fetchRiadsEnAttente(currentUser.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeterRiad = async (riadId, riadNom) => {
    if (!confirm(`Rejeter le riad "${riadNom}" ? Cette action est définitive.`)) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riadId}/rejeter`, {
        method: "PUT",
        headers: { "X-User-Id": currentUser.id },
      });
      if (!res.ok) throw new Error("Impossible de rejeter ce riad.");
      setSuccess(`Riad "${riadNom}" rejeté.`);
      fetchRiadsEnAttente(currentUser.id);
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
          🏡 Validation des Riads
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Riads soumis par les propriétaires en attente de votre approbation.
        </p>
      </div>

      {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#ef4444", marginBottom: "20px", fontWeight: 500 }}>⚠️ {error}</div>}
      {success && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#10b981", marginBottom: "20px", fontWeight: 500 }}>✅ {success}</div>}

      {riadsEnAttente.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</p>
          <p style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}> Aucun riad en attente </p>
          <p style={{ color: "var(--text-secondary)" }}>Tous les riads ont été traités.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {riadsEnAttente.map((riad) => (
            <div key={riad.id} className="card" style={{ padding: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>{riad.nom}</h3>
                  <span style={{ padding: "3px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600, color: statutRiadBadge[riad.statutValidation]?.color ?? "#6b7280", background: statutRiadBadge[riad.statutValidation]?.bg ?? "rgba(107,114,128,0.1)" }}>
                    {statutRiadBadge[riad.statutValidation]?.label ?? riad.statutValidation}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>📍 {riad.adresse}, {riad.ville}</p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>👤 Propriétaire : <strong>{riad.proprietaire?.prenom} {riad.proprietaire?.nom}</strong></p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>💰 Prix entier : <strong style={{ color: "var(--terracotta)" }}>{riad.prixRiadEntier} MAD/nuit</strong></p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>🛏️ {riad.chambres?.length ?? 0} chambre(s)</p>
                </div>
                {riad.description && <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "10px", lineHeight: 1.5, maxWidth: "600px" }}>{riad.description}</p>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "140px" }}>
                <button onClick={() => handleValiderRiad(riad.id)} disabled={actionLoading} className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>✅ Valider</button>
                <button onClick={() => handleRejeterRiad(riad.id, riad.nom)} disabled={actionLoading} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer", fontSize: "0.9rem", fontWeight: 500 }}>❌ Rejeter</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
