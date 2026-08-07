"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../../lib/LanguageContext";
import { API_BASE } from "../../../lib/api";

export default function ProprietaireLogin() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    email: "proprietaire@riad.ma",
    motDePasse: "12345678",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuickFill = (email, pass = "12345678") => {
    setFormData({
      email,
      motDePasse: pass,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email || !formData.motDePasse) {
      setError(language === "en" ? "Please fill in all required fields." : "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/connexion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (language === "en" ? "Incorrect email or password." : "Email ou mot de passe incorrect."));
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          role: data.role,
          statut: data.statut,
        })
      );

      if (data.role === "PROPRIETAIRE" || data.role === "ADMIN") {
        setSuccess(language === "en" ? "Login successful! Redirecting to Dashboard..." : "Connexion réussie ! Redirection vers votre Espace Gérant...");
        setTimeout(() => {
          router.push("/proprietaire/dashboard");
        }, 1000);
      } else {
        setSuccess(language === "en" ? "Login successful! Redirecting to Client Space..." : "Connexion réussie ! Redirection vers l'Espace Client...");
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch (err) {
      setError(err.message || (language === "en" ? "An error occurred during login." : "Une erreur est survenue lors de la connexion."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 50% 20%, #1e293b 0%, #0f172a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        fontFamily: "'Outfit', sans-serif",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Glow d'ambiance */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(217, 107, 67, 0.15) 0%, rgba(0,0,0,0) 70%)",
          pointerEvents: "none",
          zIndex: 1
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "490px",
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          padding: "44px 40px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          position: "relative",
          zIndex: 2,
          border: "1px solid rgba(255,255,255,0.2)"
        }}
      >
        {/* Sélecteur de Langue */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            display: "flex",
            alignItems: "center",
            border: "1px solid #e2e8f0",
            borderRadius: "20px",
            padding: "2px",
            backgroundColor: "#f8fafc",
          }}
        >
          <button
            onClick={() => setLanguage("fr")}
            style={{
              background: language === "fr" ? "var(--terracotta, #d96b43)" : "transparent",
              color: language === "fr" ? "#ffffff" : "#64748b",
              border: "none",
              borderRadius: "18px",
              padding: "4px 10px",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            FR
          </button>
          <button
            onClick={() => setLanguage("en")}
            style={{
              background: language === "en" ? "var(--terracotta, #d96b43)" : "transparent",
              color: language === "en" ? "#ffffff" : "#64748b",
              border: "none",
              borderRadius: "18px",
              padding: "4px 10px",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            EN
          </button>
        </div>

        {/* Header du Portail Propriétaire */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: "10px" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
              Morocco<span style={{ color: "var(--terracotta, #d96b43)" }}>Riads</span>
            </div>
          </Link>

          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "rgba(217, 107, 67, 0.1)",
                color: "var(--terracotta, #d96b43)",
                padding: "5px 14px",
                borderRadius: "20px",
                fontSize: "0.78rem",
                fontWeight: 800,
                marginTop: "4px",
                marginBottom: "14px",
                border: "1px solid rgba(217, 107, 67, 0.2)"
              }}
            >
              🏛️ {language === "en" ? "Executive Owner & PMS Portal" : "Portail Gérant Riad & PMS"}
            </span>
          </div>

          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1e293b", margin: "4px 0" }}>
            {language === "en" ? "Access your Riad Dashboard" : "Connexion Espace Propriétaire"}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
            {language === "en"
              ? "Confidential access to your Riad space, rooms and bookings"
              : "Gestion confidentielle et exclusive de vos établissements"}
          </p>
        </div>

        {/* Sélection Rapide d'Espace Propriétaire Dédié */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            📍 {language === "en" ? "Select Owner Account:" : "Sélectionner un Compte Propriétaire :" }
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              type="button"
              onClick={() => handleQuickFill("proprietaire@riad.ma", "12345678")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: formData.email === "proprietaire@riad.ma" ? "2px solid #d96b43" : "1px solid #cbd5e1",
                borderRadius: "12px",
                backgroundColor: formData.email === "proprietaire@riad.ma" ? "#fff7ed" : "#ffffff",
                color: "#1e293b",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <div>
                <span style={{ fontWeight: 800, color: "#d96b43" }}>📍 Propriétaire Marrakech</span>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>proprietaire@riad.ma (Mustapha Alaoui)</div>
              </div>
              <span style={{ fontSize: "0.75rem", backgroundColor: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: "14px", fontWeight: 700 }}>Marrakech</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("owner.fes@riad.ma", "12345678")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: formData.email === "owner.fes@riad.ma" ? "2px solid #8b5cf6" : "1px solid #cbd5e1",
                borderRadius: "12px",
                backgroundColor: formData.email === "owner.fes@riad.ma" ? "#f5f3ff" : "#ffffff",
                color: "#1e293b",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <div>
                <span style={{ fontWeight: 800, color: "#8b5cf6" }}>📍 Propriétaire Fès</span>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>owner.fes@riad.ma (Youssef Idrissi)</div>
              </div>
              <span style={{ fontSize: "0.75rem", backgroundColor: "#ede9fe", color: "#6d28d9", padding: "3px 10px", borderRadius: "14px", fontWeight: 700 }}>Fès</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("owner2@riad.ma", "12345678")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: formData.email === "owner2@riad.ma" ? "2px solid #0284c7" : "1px solid #cbd5e1",
                borderRadius: "12px",
                backgroundColor: formData.email === "owner2@riad.ma" ? "#f0f9ff" : "#ffffff",
                color: "#1e293b",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <div>
                <span style={{ fontWeight: 800, color: "#0284c7" }}>📍 Propriétaire Essaouira</span>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>owner2@riad.ma (Khadija Tazi)</div>
              </div>
              <span style={{ fontSize: "0.75rem", backgroundColor: "#e0f2fe", color: "#0369a1", padding: "3px 10px", borderRadius: "14px", fontWeight: 700 }}>Essaouira</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              fontSize: "0.85rem",
              marginBottom: "18px",
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#166534",
              fontSize: "0.85rem",
              marginBottom: "18px",
              fontWeight: 700,
            }}
          >
            ✅ {success}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
              {language === "en" ? "Owner Email Address" : "Email Propriétaire"}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="proprietaire@riad.ma"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                fontSize: "0.92rem",
                outline: "none",
                transition: "all 0.2s",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
              {language === "en" ? "Password" : "Mot de passe"}
            </label>
            <input
              type="password"
              name="motDePasse"
              value={formData.motDePasse}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                fontSize: "0.92rem",
                outline: "none",
                transition: "all 0.2s",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: "var(--terracotta, #d96b43)",
              color: "#ffffff",
              fontSize: "0.98rem",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 6px 20px rgba(217, 107, 67, 0.35)",
              marginTop: "8px",
              transition: "all 0.2s",
            }}
          >
            {loading
              ? (language === "en" ? "Authenticating..." : "Connexion en cours...")
              : (language === "en" ? "Access Dashboard" : "Accéder à mon Espace Gérant")}
          </button>
        </form>

        {/* Footer avec lien vers le site principal MoroccoRiads */}
        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "#0284c7",
              textDecoration: "none",
            }}
          >
            🌐 {language === "en" ? "Return to MoroccoRiads Public Site" : "Retour au site public MoroccoRiads"}
          </Link>
        </div>
      </div>
    </div>
  );
}
