"use client";

import { API_BASE } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../lib/LanguageContext";

export default function Register() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    telephone: "",
    role: "CLIENT", // CLIENT ou PROPRIETAIRE
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

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({
      ...prev,
      role: selectedRole,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(false);

    if (!formData.nom || !formData.prenom || !formData.email || !formData.motDePasse) {
      setError(t("register_err_required"));
      return;
    }

    if (formData.motDePasse.length < 6) {
      setError(t("register_err_password_length"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/inscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (language === "en" ? "An error occurred during registration." : "Une erreur est survenue lors de l'inscription."));
      }

      setSuccess(t("register_success"));
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        role: data.role,
        statut: data.statut
      }));

      // Redirection selon le rôle choisi lors de l'inscription
      setTimeout(() => {
        if (data.role === "PROPRIETAIRE") {
          router.push("/proprietaire/dashboard");
        } else {
          router.push("/client/catalogue");
        }
      }, 1200);

    } catch (err) {
      setError(err.message || (language === "en" ? "An error occurred during registration." : "Une erreur est survenue lors de l'inscription."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ position: "relative", maxWidth: "520px" }}>
        
        {/* Sélecteur de Langue FR / EN */}
        <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px", backgroundColor: "var(--bg-secondary)", zIndex: 10 }}>
          <button
            type="button"
            onClick={() => setLanguage("fr")}
            style={{
              background: language === "fr" ? "var(--terracotta)" : "transparent",
              color: language === "fr" ? "#fff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "18px",
              padding: "4px 8px",
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            style={{
              background: language === "en" ? "var(--terracotta)" : "transparent",
              color: language === "en" ? "#fff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "18px",
              padding: "4px 8px",
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            EN
          </button>
        </div>

        <div className="auth-header">
          <Link href="/" style={{ fontSize: "1.8rem", fontFamily: "Playfair Display, serif", fontWeight: "700", color: "var(--terracotta)", display: "inline-block", marginBottom: "12px", textDecoration: "none" }}>
            Morocco<span style={{ color: "var(--majorelle)" }}>Riads</span>
          </Link>
          <h2>{t("register_title")}</h2>
          <p>{t("register_subtitle")}</p>
        </div>

        {/* Sélection du Profil / Rôle */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            {language === "en" ? "I want to register as:" : "Je souhaite m'inscrire en tant que :"}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div
              onClick={() => handleRoleSelect("CLIENT")}
              style={{
                border: formData.role === "CLIENT" ? "2px solid var(--terracotta)" : "1px solid var(--border)",
                backgroundColor: formData.role === "CLIENT" ? "rgba(217, 107, 67, 0.08)" : "var(--bg-secondary)",
                borderRadius: "12px",
                padding: "12px 14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "center"
              }}
            >
              <div style={{ marginBottom: "6px", display: "flex", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={formData.role === "CLIENT" ? "var(--terracotta)" : "var(--text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                  <path d="M10 12h4"/>
                </svg>
              </div>
              <div style={{ fontWeight: 800, fontSize: "0.88rem", color: formData.role === "CLIENT" ? "var(--terracotta)" : "var(--text-primary)" }}>
                {language === "en" ? "Traveler / Guest" : "Voyageur / Client"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                {language === "en" ? "Book riads & suites" : "Réserver des Riads"}
              </div>
            </div>

            <div
              onClick={() => handleRoleSelect("PROPRIETAIRE")}
              style={{
                border: formData.role === "PROPRIETAIRE" ? "2px solid var(--terracotta)" : "1px solid var(--border)",
                backgroundColor: formData.role === "PROPRIETAIRE" ? "rgba(217, 107, 67, 0.08)" : "var(--bg-secondary)",
                borderRadius: "12px",
                padding: "12px 14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "center"
              }}
            >
              <div style={{ marginBottom: "6px", display: "flex", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={formData.role === "PROPRIETAIRE" ? "var(--terracotta)" : "var(--text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
                  <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
                  <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                  <path d="M10 6h4"/>
                  <path d="M10 10h4"/>
                  <path d="M10 14h4"/>
                  <path d="M10 18h4"/>
                </svg>
              </div>
              <div style={{ fontWeight: 800, fontSize: "0.88rem", color: formData.role === "PROPRIETAIRE" ? "var(--terracotta)" : "var(--text-primary)" }}>
                {language === "en" ? "Riad Owner" : "Propriétaire"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                {language === "en" ? "Manage my riad & rooms" : "Gérer mon établissement"}
              </div>
            </div>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Nom & Prénom sur une seule ligne */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prenom">{t("register_prenom")}</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                className="form-input-control"
                placeholder="Salma"
                value={formData.prenom}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="nom">{t("register_nom")}</label>
              <input
                type="text"
                id="nom"
                name="nom"
                className="form-input-control"
                placeholder="Bennani"
                value={formData.nom}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">{t("register_email")}</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input-control"
              placeholder="salma@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="telephone">{t("register_phone")}</label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              className="form-input-control"
              placeholder="+212 600 000 000"
              value={formData.telephone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="motDePasse">{t("register_password")}</label>
            <input
              type="password"
              id="motDePasse"
              name="motDePasse"
              className="form-input-control"
              placeholder="Min. 6 caractères"
              value={formData.motDePasse}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "10px", padding: "14px" }}
            disabled={loading}
          >
            {loading ? t("register_loading") : t("register_btn")}
          </button>
        </form>

        <div className="auth-footer">
          {t("register_already")}{" "}
          <Link href="/login">{t("register_login")}</Link>
        </div>
      </div>
    </div>
  );
}
