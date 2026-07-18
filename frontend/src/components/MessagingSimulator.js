"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";

export default function MessagingSimulator() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sms"); // 'sms' ou 'email'
  const [smsList, setSmsList] = useState([]);
  const [emailList, setEmailList] = useState([]);

  // Écouter les événements globaux de notification simulée
  useEffect(() => {
    const handleSimulatedNotification = (e) => {
      const { type, message, email, phone, sender, subject, timestamp } = e.detail;
      const date = timestamp || new Date().toLocaleTimeString();

      if (type === "sms") {
        setSmsList((prev) => [
          {
            id: Math.random().toString(),
            sender: sender || "MoroccoRiads",
            phone: phone || "+212 600 000 000",
            message,
            time: date
          },
          ...prev
        ]);
      } else if (type === "email") {
        setEmailList((prev) => [
          {
            id: Math.random().toString(),
            sender: sender || "contact@moroccoriads.com",
            email: email || "user@email.com",
            subject: subject || "Notification MoroccoRiads",
            message,
            time: date
          },
          ...prev
        ]);
      }
      
      // Ouvrir automatiquement le simulateur pour montrer la réception
      setIsOpen(true);
    };

    window.addEventListener("simulated_notification", handleSimulatedNotification);
    return () => {
      window.removeEventListener("simulated_notification", handleSimulatedNotification);
    };
  }, []);

  return (
    <div style={{ position: "fixed", bottom: "30px", left: "30px", zIndex: 9999, fontFamily: "sans-serif" }}>
      
      {/* 1. Bouton Discret de Messagerie (Icône de Téléphone / Boîte Mail) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "12px",
          backgroundColor: "#1e293b", // Slate 800
          border: "none",
          boxShadow: "0 4px 15px rgba(30, 41, 59, 0.3)",
          color: "white",
          fontSize: "1.4rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s",
          position: "relative"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        title={language === "en" ? "Simulated Inbox (SMS & Emails)" : "Simulateur Messagerie (SMS & Emails)"}
      >
        📱
        {(smsList.length > 0 || emailList.length > 0) && (
          <span style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            backgroundColor: "#ef4444", // Red 500
            color: "white",
            fontSize: "0.68rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {smsList.length + emailList.length}
          </span>
        )}
      </button>

      {/* 2. Panneau de Simulation */}
      {isOpen && (
        <div style={{
          position: "absolute",
          bottom: "65px",
          left: "0",
          width: "360px",
          height: "520px",
          backgroundColor: "#0f172a", // Slate 900
          borderRadius: "24px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          border: "4px solid #334155", // Slate 700 (Simule un bord d'appareil)
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#f8fafc"
        }}>
          {/* Header du Simulateur */}
          <div style={{
            padding: "16px 20px 10px 20px",
            borderBottom: "1px solid #334155",
            backgroundColor: "#1e293b"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#94a3b8" }}>
                ⚙️ SIMULATEUR CANAUX
              </span>
              <button 
                onClick={() => setIsOpen(false)} 
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>

            {/* Onglets */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setActiveTab("sms")}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: activeTab === "sms" ? "#3b82f6" : "#0f172a",
                  color: "white",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                💬 SMS ({smsList.length})
              </button>
              <button
                onClick={() => setActiveTab("email")}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: activeTab === "email" ? "#3b82f6" : "#0f172a",
                  color: "white",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                ✉️ Email ({emailList.length})
              </button>
            </div>
          </div>

          {/* Corps de Simulation */}
          <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* ── Onglet SMS (Écran de téléphone mobile) ──────────────── */}
            {activeTab === "sms" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
                {smsList.length === 0 ? (
                  <div style={{ margin: "auto", textAlign: "center", color: "#64748b" }}>
                    <p style={{ fontSize: "2rem", marginBottom: "8px" }}>💬</p>
                    <p style={{ fontSize: "0.85rem" }}>Aucun SMS reçu. Faites une réservation pour recevoir un SMS !</p>
                  </div>
                ) : (
                  smsList.map((sms) => (
                    <div key={sms.id} style={{ display: "flex", flexDirection: "column", alignSelf: "flex-start", maxWidth: "85%" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: "8px", marginBottom: "4px" }}>
                        {sms.sender} ({sms.phone}) — {sms.time}
                      </span>
                      <div style={{
                        backgroundColor: "#1e293b",
                        padding: "10px 14px",
                        borderRadius: "18px",
                        fontSize: "0.82rem",
                        lineHeight: "1.4",
                        color: "#f1f5f9"
                      }}>
                        {sms.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Onglet Email (Boîte de réception webmail) ──────────────── */}
            {activeTab === "email" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}>
                {emailList.length === 0 ? (
                  <div style={{ margin: "auto", textAlign: "center", color: "#64748b" }}>
                    <p style={{ fontSize: "2rem", marginBottom: "8px" }}>✉️</p>
                    <p style={{ fontSize: "0.85rem" }}>Boîte de réception vide. Les e-mails de confirmation s'afficheront ici.</p>
                  </div>
                ) : (
                  emailList.map((email) => (
                    <div key={email.id} style={{
                      backgroundColor: "#1e293b",
                      borderRadius: "10px",
                      padding: "12px",
                      border: "1px solid #334155"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #334155", paddingBottom: "6px" }}>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          <strong>De :</strong> {email.sender}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{email.time}</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#3b82f6", fontWeight: 600, marginBottom: "6px" }}>
                        Sujet : {email.subject}
                      </div>
                      <div style={{
                        fontSize: "0.78rem",
                        lineHeight: "1.4",
                        color: "#cbd5e1",
                        whiteSpace: "pre-line"
                      }}>
                        {email.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
