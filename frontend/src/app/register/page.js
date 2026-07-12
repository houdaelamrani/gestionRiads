"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    telephone: "",
    role: "CLIENT", // CLIENT ou PROPRIETAIRE par défaut
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

    // Validations basiques côté client
    if (!formData.nom || !formData.prenom || !formData.email || !formData.motDePasse) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (formData.motDePasse.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);

    try {
      // Appel API vers notre backend Spring Boot
      const response = await fetch("http://localhost:8080/api/auth/inscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue lors de l'inscription.");
      }

      setSuccess("Inscription réussie ! Connexion automatique...");
      
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

      // Redirection intelligente selon le rôle choisi
      setTimeout(() => {
        if (data.role === "CLIENT") {
          router.push("/client");
        } else if (data.role === "PROPRIETAIRE") {
          router.push("/proprietaire");
        } else {
          router.push("/");
        }
      }, 1500);

    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
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
          <h2>Créer votre compte</h2>
          <p>Rejoignez-nous pour réserver ou proposer vos Riads au Maroc.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Nom & Prénom sur une seule ligne */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
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
              <label htmlFor="nom">Nom</label>
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
            <label htmlFor="email">Adresse email</label>
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
            <label htmlFor="telephone">Téléphone (Optionnel)</label>
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
            <label htmlFor="motDePasse">Mot de passe</label>
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

          {/* Sélection du rôle (Client ou Propriétaire) */}
          <div className="form-group">
            <label>Je souhaite m'inscrire en tant que :</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value="CLIENT"
                  checked={formData.role === "CLIENT"}
                  onChange={handleChange}
                />
                👤 Voyageur (Client)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value="PROPRIETAIRE"
                  checked={formData.role === "PROPRIETAIRE"}
                  onChange={handleChange}
                />
                🏨 Hébergeur (Propriétaire)
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "10px", padding: "14px" }}
            disabled={loading}
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <div className="auth-footer">
          Vous avez déjà un compte ?{" "}
          <Link href="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
