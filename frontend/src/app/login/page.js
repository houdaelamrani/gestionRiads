"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../lib/LanguageContext";

export default function Login() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [formData, setFormData] = useState({
    email: "",
    motDePasse: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(false);

    if (!formData.email || !formData.motDePasse) {
      setError(t("login_err_required"));
      return;
    }

    setLoading(true);

    try {
      // Appel API vers le service d'authentification
      const response = await fetch("http://localhost:8080/api/auth/connexion", {
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

      setSuccess(t("login_success"));
      
      // Stocker les données de session dans le localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        role: data.role,
        statut: data.statut
      }));

      // Redirection intelligente selon le rôle de l'utilisateur
      setTimeout(() => {
        if (data.role === "CLIENT") {
          router.push("/client");
        } else if (data.role === "PROPRIETAIRE") {
          router.push("/proprietaire");
        } else if (data.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }, 1500);

    } catch (err) {
      setError(err.message || (language === "en" ? "An error occurred during login." : "Une erreur est survenue lors de la connexion."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ position: "relative" }}>
        
        {/* Lang Selector inside card */}
        <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px", backgroundColor: "var(--bg-secondary)", zIndex: 10 }}>
          <button
            onClick={() => setLanguage("fr")}
            style={{
              background: language === "fr" ? "var(--terracotta)" : "transparent",
              color: language === "fr" ? "#fff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "18px",
              padding: "3px 6px",
              fontSize: "0.65rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            FR
          </button>
          <button
            onClick={() => setLanguage("en")}
            style={{
              background: language === "en" ? "var(--terracotta)" : "transparent",
              color: language === "en" ? "#fff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "18px",
              padding: "3px 6px",
              fontSize: "0.65rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            EN
          </button>
        </div>

        <div className="auth-header">
          <Link href="/" style={{ fontSize: "1.8rem", fontFamily: "Playfair Display, serif", fontWeight: "700", color: "var(--terracotta)", display: "inline-block", marginBottom: "12px" }}>
            Morocco<span style={{ color: "var(--majorelle)" }}>Riads</span>
          </Link>
          <h2>{t("login_title")}</h2>
          <p>{t("login_subtitle")}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t("login_email")}</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input-control"
              placeholder="exemple@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="motDePasse">{t("login_password")}</label>
            <input
              type="password"
              id="motDePasse"
              name="motDePasse"
              className="form-input-control"
              placeholder="••••••••"
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
            {loading ? t("login_loading") : t("login_btn")}
          </button>
        </form>

        <div className="auth-footer">
          {t("login_new")}{" "}
          <Link href="/register">{t("login_create")}</Link>
        </div>
      </div>
    </div>
  );
}

