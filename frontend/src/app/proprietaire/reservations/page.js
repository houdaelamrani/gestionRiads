"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:8080";

const statutColors = {
  EN_ATTENTE: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "En attente" },
  CONFIRMEE: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Confirmée" },
  ANNULEE: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Annulée" },
  REFUSEE: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Refusée" },
};

export default function ProprietaireReservations() {
  const [currentUser, setCurrentUser] = useState(null);
  const [reservationsRecues, setReservationsRecues] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchReservationsRecues = useCallback(async (userId) => {
    setReservationsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reservations/owner`, {
        headers: { "X-User-Id": userId },
      });
      if (!res.ok) throw new Error("Impossible de charger les réservations.");
      const data = await res.json();
      setReservationsRecues(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setReservationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchReservationsRecues(user.id);
    }
  }, [fetchReservationsRecues]);

  const handleModifierStatutReservation = async (reservationId, statut, label) => {
    if (!confirm(`Voulez-vous ${label.toLowerCase()} cette réservation ?`)) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${reservationId}/statut?statut=${statut}`, {
        method: "PUT",
        headers: { "X-User-Id": currentUser.id },
      });
      if (!res.ok) throw new Error(`Impossible de ${label.toLowerCase()} cette réservation.`);
      setSuccess(`Réservation ${label.toLowerCase()} avec succès !`);
      fetchReservationsRecues(currentUser.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Notifications */}
      {error && <div className="auth-error" style={{ marginBottom: "20px" }}>{error}</div>}
      {success && <div className="auth-success" style={{ marginBottom: "20px" }}>{success}</div>}

      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", color: "var(--text-primary)" }}>
          📋 Réservations reçues pour vos Riads
        </h3>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px" }}>
          Toutes les demandes de réservation faites par les clients sur vos hébergements.
        </p>
      </div>

      {reservationsLoading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="spinner" />
        </div>
      ) : reservationsRecues.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</p>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>Aucune réservation reçue pour le moment.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reservationsRecues.map((res) => {
            const badge = statutColors[res.statut] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: res.statut };
            return (
              <div key={res.id} className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                    Client : {res.client?.prenom} {res.client?.nom}
                  </p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                    🏡 {res.riad?.nom} — 📅 {res.dateDebut} → {res.dateFin}
                  </p>
                  <p style={{ color: "var(--terracotta)", fontWeight: 700, fontSize: "0.95rem", marginTop: "4px" }}>
                    💰 {res.prixTotal} MAD
                    {res.riadEntier && (
                      <span style={{ marginLeft: "10px", fontSize: "0.8rem", color: "var(--majorelle)", fontWeight: 500 }}>(Riad entier)</span>
                    )}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600, color: badge.color, background: badge.bg }}>
                    {badge.label}
                  </span>
                  {res.statut === "EN_ATTENTE" && (
                    <>
                      <button
                        onClick={() => handleModifierStatutReservation(res.id, "CONFIRMEE", "confirmée")}
                        disabled={actionLoading}
                        style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.08)", color: "#10b981", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
                      >
                        ✅ Confirmer
                      </button>
                      <button
                        onClick={() => handleModifierStatutReservation(res.id, "ANNULEE", "refusée")}
                        disabled={actionLoading}
                        style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
                      >
                        ❌ Refuser
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
