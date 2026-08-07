"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "../../../lib/LanguageContext";
import { API_BASE } from "../../../lib/api.js";

const statutBadge = {
  EN_ATTENTE: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  CONFIRMEE: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  ANNULEE: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  REFUSEE: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

export default function ClientReservations() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAvisModal, setShowAvisModal] = useState(false);
  const [avisRiadId, setAvisRiadId] = useState(null);
  const [avisRiadNom, setAvisRiadNom] = useState("");
  const [avisForm, setAvisForm] = useState({ note: 5, commentaire: "" });

  const getStatusLabel = (status) => {
    switch (status) {
      case "EN_ATTENTE": return t("status_pending");
      case "CONFIRMEE": return t("status_confirmed");
      case "ANNULEE": return t("status_cancelled");
      case "REFUSEE": return t("status_refused");
      default: return status;
    }
  };

  const fetchReservations = useCallback(async (userId) => {
    setReservationsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reservations/client`, {
        headers: { "X-User-Id": userId },
      });
      if (!res.ok) throw new Error("Impossible de charger vos réservations.");
      const data = await res.json();
      setReservations(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setReservationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchReservations(user.id);
    }
  }, [fetchReservations]);

  // Vider automatiquement le message de succès après 5 secondes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAnnuler = async (reservationId) => {
    if (!confirm(t("confirm_cancel"))) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${reservationId}/annuler`, {
        method: "PUT",
        headers: { "X-User-Id": currentUser.id },
      });
      if (!res.ok) throw new Error("Impossible d'annuler cette réservation.");
      setSuccess(t("res_cancelled"));
      fetchReservations(currentUser.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openAvisModal = (riadId, riadNom) => {
    setAvisRiadId(riadId);
    setAvisRiadNom(riadNom);
    setAvisForm({ note: 5, commentaire: "" });
    setShowAvisModal(true);
    setError("");
    setSuccess("");
  };

  const handleAvisSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/avis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser.id,
        },
        body: JSON.stringify({
          riadId: avisRiadId,
          note: avisForm.note,
          commentaire: avisForm.commentaire,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors de la soumission de l'avis.");
      setSuccess(t("review_success"));
      setShowAvisModal(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Notifications */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#ef4444", marginBottom: "20px", fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#10b981", marginBottom: "20px", fontWeight: 500 }}>
          ✅ {success}
        </div>
      )}

      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "2.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
          {t("reservations_title")}
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {t("reservations_subtitle")}
        </p>
      </div>

      {reservationsLoading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="spinner" />
        </div>
      ) : reservations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: "3rem", marginBottom: "16px" }}>📋</p>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", marginBottom: "24px" }}>
            {t("no_reservations")}
          </p>
          <Link href="/client/catalogue" className="btn btn-primary" style={{ padding: "12px 28px" }}>
            {t("explore_riads")}
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reservations.map((res) => {
            const badge = statutBadge[res.statut] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
            const label = getStatusLabel(res.statut);
            return (
              <div key={res.id} className="card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                      {res.riad?.nom ?? "Riad"}
                    </h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                      📅 {t("from")} <strong>{res.dateDebut}</strong> {t("to")} <strong>{res.dateFin}</strong>
                    </p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
                      💰 {t("total")} <strong style={{ color: "var(--terracotta)" }}>{res.prixTotal} MAD</strong>
                    </p>
                    {res.riadEntier && (
                      <p style={{ color: "var(--majorelle)", fontSize: "0.82rem", marginTop: "4px" }}>{t("entire_riad")}</p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                    <span style={{ padding: "4px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600, color: badge.color, background: badge.bg }}>
                      {label}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {res.statut === "EN_ATTENTE" && (
                        <button
                          onClick={() => handleAnnuler(res.id)}
                          disabled={actionLoading}
                          style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500 }}
                        >
                          {t("cancel")}
                        </button>
                      )}
                      {res.statut === "CONFIRMEE" && res.riad && (
                        <button
                          onClick={() => openAvisModal(res.riad.id, res.riad.nom)}
                          style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.06)", color: "#f59e0b", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
                        >
                          {t("leave_review")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Laisser un Avis */}
      {showAvisModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "32px", backgroundColor: "#ffffff", color: "var(--text-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {t("review_title")} {avisRiadNom}
              </h2>
              <button onClick={() => setShowAvisModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-secondary)" }}>×</button>
            </div>

            <form onSubmit={handleAvisSubmit}>
              <div style={{ marginBottom: "24px", textAlign: "center" }}>
                <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>{t("your_rating")}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAvisForm((prev) => ({ ...prev, note: star }))}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "2.2rem",
                        cursor: "pointer",
                        color: star <= avisForm.note ? "#f59e0b" : "#d1d5db",
                        transition: "transform 0.15s, color 0.15s",
                        transform: star <= avisForm.note ? "scale(1.15)" : "scale(1)",
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "8px" }}>{avisForm.note}/5</p>
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label>{t("your_comment")}</label>
                <textarea
                  className="form-input-control"
                  placeholder={t("comment_placeholder")}
                  style={{ minHeight: "100px", resize: "vertical" }}
                  value={avisForm.commentaire}
                  onChange={(e) => setAvisForm((prev) => ({ ...prev, commentaire: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1rem" }} disabled={actionLoading}>
                {actionLoading ? t("sending_review") : t("submit_review")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

