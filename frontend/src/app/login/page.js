"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
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
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);

    try {
      // Appel API vers notre backend Spring Boot
      const response = await fetch("http://localhost:8080/api/auth/connexion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Email ou mot de passe incorrect.");
      }

      setSuccess("Connexion réussie ! Redirection vers votre espace...");
      
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
      setError(err.message || "Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" style={{ fontSize: "1.8rem", fontFamily: "Playfair Display, serif", fontWeight: "700", color: "var(--terracotta)", display: "inline-block", marginBottom: "12px" }}>
            Morocco<span style={{ color: "var(--majorelle)" }}>Riads</span>
          </Link>
          <h2>Ravi de vous revoir !</h2>
          <p>Connectez-vous pour accéder à votre espace personnalisé.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
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
            <label htmlFor="motDePasse">Mot de passe</label>
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
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="auth-footer">
          Nouveau sur MoroccoRiads ?{" "}
          <Link href="/register">Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}
