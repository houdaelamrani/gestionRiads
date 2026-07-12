"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:8080";

export default function Home() {
  const [riads, setRiads] = useState([]);
  const [riadPhotos, setRiadPhotos] = useState({}); // { riadId: [photos] }
  const [riadAvis, setRiadAvis] = useState({}); // { riadId: { moy, count } }
  const [selectedCity, setSelectedCity] = useState("Tous");
  const [activeActor, setActiveActor] = useState("client"); // client, owner, admin
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingRiads, setLoadingRiads] = useState(true);
  const [availableCities, setAvailableCities] = useState(["Tous"]);

  // ── Charger les riads depuis l'API ────────────────────────────────────────
  const fetchRiads = async (ville = "Tous") => {
    setLoadingRiads(true);
    try {
      const url =
        ville === "Tous"
          ? `${API_BASE}/api/riads/recherche`
          : `${API_BASE}/api/riads/recherche?ville=${encodeURIComponent(ville)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRiads(data);

        // Extraire les villes uniques uniquement s'il s'agit du chargement initial "Tous"
        if (ville === "Tous") {
          const uniqueCities = [...new Set(data.map((r) => r.ville))];
          setAvailableCities(["Tous", ...uniqueCities]);
        }

        // Charger les photos et avis de chaque riad
        data.forEach((riad) => {
          fetchRiadPhotos(riad.id);
          fetchRiadAvis(riad.id);
        });
      }
    } catch (e) {
      console.error("Erreur chargement riads:", e);
    } finally {
      setLoadingRiads(false);
    }
  };

  const fetchRiadPhotos = async (riadId) => {
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riadId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setRiadPhotos((prev) => ({ ...prev, [riadId]: data }));
      }
    } catch (e) { /* silencieux */ }
  };

  const fetchRiadAvis = async (riadId) => {
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riadId}/avis`);
      if (res.ok) {
        const data = await res.json();
        const count = data.length;
        const moy =
          count > 0
            ? (data.reduce((sum, a) => sum + a.note, 0) / count).toFixed(1)
            : 0;
        setRiadAvis((prev) => ({ ...prev, [riadId]: { moy: Number(moy), count } }));
      }
    } catch (e) { /* silencieux */ }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      if (user.role === "CLIENT") setActiveActor("client");
      if (user.role === "PROPRIETAIRE") setActiveActor("owner");
      if (user.role === "ADMIN") setActiveActor("admin");
    }
    fetchRiads();
  }, []);

  const handleCityFilter = (ville) => {
    setSelectedCity(ville);
    fetchRiads(ville);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  const renderStars = (note) => {
    const n = Math.round(note);
    return "★".repeat(n) + "☆".repeat(5 - n);
  };

  return (
    <div>
      {/* 1. Navbar */}
      <nav className="navbar">
        <a href="#" className="nav-logo">
          Morocco<span>Riads</span>
        </a>
        <ul className="nav-links">
          <li>
            <a href="#riads" className="nav-item active">
              Nos Riads
            </a>
          </li>
          <li>
            <a href="#comment" className="nav-item">
              Comment ça marche ?
            </a>
          </li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {currentUser ? (
            <>
              <span
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                }}
              >
                Bonjour,{" "}
                <strong style={{ color: "var(--terracotta)" }}>
                  {currentUser.prenom}
                </strong>
              </span>
              {currentUser.role === "CLIENT" && (
                <Link
                  href="/client"
                  className="btn btn-secondary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.85rem",
                    border: "1px solid #3b82f6",
                    color: "#3b82f6",
                  }}
                >
                  📋 Mon Espace Client
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  border: "1px solid var(--text-secondary)",
                  color: "var(--text-secondary)",
                }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="btn btn-primary"
                style={{ padding: "8px 20px", fontSize: "0.85rem" }}
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <p className="hero-subtitle">Une immersion marocaine authentique</p>
          <h1 className="hero-title">
            Trouvez le Riad de vos Rêves au Maroc
          </h1>
          <p className="hero-desc">
            Réservez une chambre unique, plusieurs suites pour votre famille,
            ou privatisez un riad entier à Marrakech, Fès ou Essaouira.
          </p>
        </div>
      </header>

      {/* 3. Widget de Recherche */}
      <section className="search-container">
        <div className="search-widget">
          <div className="search-field">
            <label htmlFor="ville">Destination (Ville)</label>
            <select
              id="ville"
              value={selectedCity}
              onChange={(e) => handleCityFilter(e.target.value)}
            >
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city === "Tous" ? "Toutes les villes" : city}
                </option>
              ))}
            </select>
          </div>
          <div className="search-field">
            <label htmlFor="checkin">Arrivée</label>
            <input type="date" id="checkin" defaultValue="2026-08-01" />
          </div>
          <div className="search-field">
            <label htmlFor="checkout">Départ</label>
            <input type="date" id="checkout" defaultValue="2026-08-05" />
          </div>
          <div className="search-field">
            <label htmlFor="chambres-count">Voyageurs</label>
            <select id="chambres-count">
              <option>1 Chambre (2 pers.)</option>
              <option>Plusieurs Chambres</option>
              <option>Riad Complet</option>
            </select>
          </div>
          <div className="search-btn-container">
            <a
              href="#riads"
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px" }}
            >
              Rechercher
            </a>
          </div>
        </div>
      </section>

      {/* 4. Contenu Principal */}
      <main className="main-container">
        {/* Section Riads Disponibles */}
        <section id="riads" style={{ padding: "60px 0" }}>
          <div className="section-header">
            <h2>Riads Authentiques Populaires</h2>
            <p>
              Découvrez notre sélection de Riads validés par notre équipe,
              prêts à vous accueillir.
            </p>
          </div>

          {loadingRiads ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: "var(--text-secondary)",
              }}
            >
              <p style={{ fontSize: "1.1rem" }}>Chargement des riads...</p>
            </div>
          ) : (
            <div className="riads-grid">
              {riads.map((riad) => {
                const photos = riadPhotos[riad.id] || [];
                const avisInfo = riadAvis[riad.id] || { moy: 0, count: 0 };
                const mainPhoto = photos.length > 0 ? photos[0].url : null;
                const minPrice =
                  riad.chambres?.length > 0
                    ? Math.min(
                        ...riad.chambres.map((c) => c.prixParNuit)
                      )
                    : riad.prixRiadEntier;

                return (
                  <article className="riad-card" key={riad.id}>
                    <div className="riad-img-container">
                      {avisInfo.count > 0 && (
                        <span className="riad-tag">
                          ★ {avisInfo.moy}
                        </span>
                      )}
                      {mainPhoto ? (
                        <img
                          src={mainPhoto}
                          alt={riad.nom}
                          className="riad-img"
                        />
                      ) : (
                        <div
                          className="riad-img"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--terracotta), var(--majorelle))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "4rem",
                            height: "100%",
                            width: "100%",
                          }}
                        >
                          🏡
                        </div>
                      )}
                      <span className="riad-price-tag">
                        Dès {minPrice ?? "—"} MAD / nuit
                      </span>
                    </div>
                    <div className="riad-info">
                      <p className="riad-city">{riad.ville}</p>
                      <h3 className="riad-name">{riad.nom}</h3>
                      <div className="riad-rating">
                        <span>
                          {riad.chambres?.length ?? 0} chambres disponibles
                          {avisInfo.count > 0 && (
                            <>
                              {" "}
                              •{" "}
                              <span style={{ color: "#f59e0b" }}>
                                {renderStars(avisInfo.moy)}
                              </span>{" "}
                              {avisInfo.count} avis
                            </>
                          )}
                        </span>
                      </div>
                      <p className="riad-desc">{riad.description}</p>
                      <div className="riad-footer">
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                            fontStyle: "italic",
                          }}
                        >
                          📍 {riad.adresse}
                        </span>
                        {currentUser?.role === "CLIENT" ? (
                          <Link
                            href="/client"
                            className="btn btn-secondary"
                            style={{
                              padding: "6px 14px",
                              fontSize: "0.85rem",
                            }}
                          >
                            Réserver
                          </Link>
                        ) : (
                          <Link
                            href="/login"
                            className="btn btn-secondary"
                            style={{
                              padding: "6px 14px",
                              fontSize: "0.85rem",
                            }}
                          >
                            Réserver
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              {riads.length === 0 && !loadingRiads && (
                <div
                  style={{
                    gridColumn: "span 3",
                    textAlign: "center",
                    padding: "40px",
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                  }}
                >
                  <p style={{ color: "var(--text-secondary)" }}>
                    Aucun riad disponible dans cette ville pour le moment.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>



        {/* Section Comment ça marche */}
        <section id="comment" style={{ padding: "40px 0 80px 0" }}>
          <div className="section-header">
            <h2>Fonctionnalités Clés du Projet PFA</h2>
            <p>
              Notre architecture Spring Boot, Next.js et PostgreSQL couvre les
              flux métiers essentiels :
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "30px",
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "16px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  color: "var(--terracotta)",
                  fontSize: "2rem",
                  marginBottom: "16px",
                }}
              >
                🔍
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "12px" }}>
                Filtres & Photos
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                }}
              >
                Recherche de riads par ville. Affichage de galeries photos
                hébergées sur le cloud gratuit Cloudinary.
              </p>
            </div>
            <div
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "16px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  color: "var(--majorelle)",
                  fontSize: "2rem",
                  marginBottom: "16px",
                }}
              >
                📅
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "12px" }}>
                Réservations Flexibles
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                }}
              >
                Une table d'association `reservation_chambres` permet au
                client de louer une chambre, plusieurs ou de privatiser le
                riad.
              </p>
            </div>
            <div
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "16px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  color: "var(--gold)",
                  fontSize: "2rem",
                  marginBottom: "16px",
                }}
              >
                ⭐
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "12px" }}>
                Avis & Notes
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                }}
              >
                Partagez votre expérience et donnez une évaluation de 1 à 5
                étoiles après chaque séjour pour guider les autres voyageurs.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-col">
            <h3 className="footer-logo">
              Morocco<span>Riads</span>
            </h3>
            <p className="footer-desc">
              La plateforme de référence pour réserver des séjours uniques
              dans les plus beaux riads traditionnels du Maroc.
            </p>
          </div>
          <div className="footer-col">
            <h4>Destinations</h4>
            <ul className="footer-links">
              <li>
                <a href="#" onClick={() => handleCityFilter("Marrakech")}>
                  Marrakech
                </a>
              </li>
              <li>
                <a href="#" onClick={() => handleCityFilter("Fès")}>
                  Fès
                </a>
              </li>
              <li>
                <a href="#" onClick={() => handleCityFilter("Essaouira")}>
                  Essaouira
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Plateforme</h4>
            <ul className="footer-links">
              <li>
                <a href="#riads">Nos Riads</a>
              </li>
              <li>
                <a href="#comment">Fonctionnalités</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Newsletter</h4>
            <p style={{ fontSize: "0.9rem", marginBottom: "16px" }}>
              Abonnez-vous pour recevoir des offres exclusives.
            </p>
            <form
              className="newsletter-form"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Abonnement réussi !");
              }}
            >
              <input type="email" placeholder="Votre email" required />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "10px 16px" }}
              >
                S'abonner
              </button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © 2026 MoroccoRiads. Projet PFA de gestion des Riads au Maroc.
          </p>
          <p>Technologies : Spring Boot 3 + Next.js 16 + PostgreSQL</p>
        </div>
      </footer>
    </div>
  );
}
