"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { mapPhotoUrl, API_BASE } from "../lib/api.js";
import { useLanguage } from "../lib/LanguageContext";
import { getNotifications, markNotificationsAsRead, getUnreadCount } from "../lib/NotificationSystem";

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [riads, setRiads] = useState([]);
  const [riadPhotos, setRiadPhotos] = useState({}); // { riadId: [photos] }
  const [riadAvis, setRiadAvis] = useState({}); // { riadId: { moy, count } }
  const [selectedCity, setSelectedCity] = useState("Tous");
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingRiads, setLoadingRiads] = useState(true);
  const [availableCities, setAvailableCities] = useState(["Tous"]);

  // États pour recherche avancée
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  // États pour navigation et notifications
  const [activeNavTab, setActiveNavTab] = useState("riads");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Synchronisation des notifications locales
  useEffect(() => {
    const updateNotifs = () => {
      setNotifications(getNotifications());
      setUnreadCount(getUnreadCount());
    };
    updateNotifs();
    window.addEventListener("notifications_updated", updateNotifs);
    return () => window.removeEventListener("notifications_updated", updateNotifs);
  }, []);

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
    window.location.href = "/login";
  };

  const renderStars = (note) => {
    const n = Math.round(note);
    return "★".repeat(n) + "☆".repeat(5 - n);
  };

  // Filtrage avancé côté client
  const filteredRiadsList = riads.filter((riad) => {
    // Filtrer par budget maximum
    if (maxBudget) {
      const limit = parseFloat(maxBudget);
      const minPrice = riad.chambres?.length > 0
        ? Math.min(...riad.chambres.map((c) => c.prixParNuit))
        : riad.prixRiadEntier;
      if (minPrice > limit) return false;
    }
    // Filtrer par nombre de voyageurs (capacité de chambre)
    if (guests) {
      const numGuests = parseInt(guests);
      if (riad.chambres?.length > 0) {
        const hasCapacity = riad.chambres.some((c) => c.capacite >= numGuests);
        if (!hasCapacity) return false;
      } else if (riad.capaciteMaximale && riad.capaciteMaximale < numGuests) {
        return false;
      }
    }
    return true;
  });

  return (
    <div>
      {/* 1. Navbar */}
      <nav className="navbar">
        <a href="#" className="nav-logo">
          Morocco<span>Riads</span>
        </a>
        <ul className="nav-links">
          <li>
            <a
              href="#riads"
              className={`nav-item ${activeNavTab === "riads" ? "active" : ""}`}
              onClick={() => setActiveNavTab("riads")}
            >
              {t("nav_riads")}
            </a>
          </li>
          <li>
            <a
              href="#comment"
              className={`nav-item ${activeNavTab === "services" ? "active" : ""}`}
              onClick={() => setActiveNavTab("services")}
            >
              {t("nav_services")}
            </a>
          </li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          
          {/* Cloche de notifications (Affichée uniquement si le client est connecté/inscrit) */}
          {currentUser && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markNotificationsAsRead();
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  color: "var(--text-secondary)"
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#ef4444",
                    color: "white",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: "absolute",
                  top: "35px",
                  right: "0",
                  width: "290px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  border: "1px solid var(--border)",
                  zIndex: 1000,
                  maxHeight: "320px",
                  overflowY: "auto",
                  padding: "10px 0"
                }}>
                  <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    {language === "en" ? "Notifications" : "Notifications"}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      {language === "en" ? "No new notifications" : "Aucune notification"}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--gray-light)",
                        fontSize: "0.8rem",
                        lineHeight: "1.4",
                        backgroundColor: n.read ? "transparent" : "#f0f9ff",
                        color: "var(--text-primary)"
                      }}>
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lang Selector */}
          <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px", backgroundColor: "var(--bg-secondary)" }}>
            <button
              onClick={() => setLanguage("fr")}
              style={{
                background: language === "fr" ? "var(--terracotta)" : "transparent",
                color: language === "fr" ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "18px",
                padding: "4px 10px",
                fontSize: "0.75rem",
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
                padding: "4px 10px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              EN
            </button>
          </div>

          {currentUser ? (
            <>
              <span
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                }}
              >
                {t("hello")}{" "}
                <strong style={{ color: "var(--terracotta)" }}>
                  {currentUser.prenom}
                </strong>
              </span>
              {currentUser.role === "CLIENT" && (
                <Link
                  href="/client/catalogue"
                  className="btn btn-secondary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.85rem",
                    border: "1px solid var(--terracotta)",
                    color: "var(--terracotta)",
                    fontWeight: 700
                  }}
                >
                  🏡 Mon Espace Client
                </Link>
              )}
              {currentUser.role === "PROPRIETAIRE" && (
                <Link
                  href="/proprietaire/dashboard"
                  className="btn btn-secondary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.85rem",
                    border: "1px solid var(--terracotta)",
                    color: "var(--terracotta)",
                    fontWeight: 700
                  }}
                >
                  🏰 Mon Espace Gérant
                </Link>
              )}
              {currentUser.role === "ADMIN" && (
                <Link
                  href="/proprietaire/dashboard"
                  className="btn btn-secondary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.85rem",
                    border: "1px solid #6366f1",
                    color: "#6366f1",
                    fontWeight: 700
                  }}
                >
                  👨‍💼 Espace Administrateur
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
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn btn-secondary"
                style={{ padding: "8px 18px", fontSize: "0.85rem", fontWeight: 700 }}
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="btn btn-primary"
                style={{ padding: "8px 20px", fontSize: "0.85rem", fontWeight: 700 }}
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <p className="hero-subtitle">{t("hero_subtitle")}</p>
          <h1 className="hero-title">
            {t("hero_title")}
          </h1>
          <p className="hero-desc">
            {t("hero_desc")}
          </p>
        </div>
      </header>

      {/* 3. Widget de Recherche Style Airbnb Avancé */}
      <section style={{ display: "flex", justifyContent: "center", marginTop: "-35px", marginBottom: "50px", position: "relative", zIndex: 10 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          backgroundColor: "#ffffff",
          borderRadius: "32px",
          padding: "8px 16px 8px 24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02)",
          border: "1px solid var(--border)",
          width: "92%",
          maxWidth: "850px",
          gap: "12px",
          transition: "box-shadow 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.12)"}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.08)"}
        >
          {/* Destination */}
          <div style={{ flex: 1.2, minWidth: "140px", display: "flex", flexDirection: "column", textAlign: "left" }}>
            <label htmlFor="ville" style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
              {t("search_destination")}
            </label>
            <select
              id="ville"
              value={selectedCity}
              onChange={(e) => handleCityFilter(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                padding: "2px 0",
                cursor: "pointer",
                width: "100%"
              }}
            >
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city === "Tous" ? t("search_anywhere") : city}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border)" }} />

          {/* Dates d'arrivée & Départ */}
          <div style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column", textAlign: "left" }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
              {language === "en" ? "Check-in" : "Arrivée"}
            </label>
            <input
              type="date"
              value={checkIn}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setCheckIn(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                padding: "2px 0",
                cursor: "pointer",
                width: "100%"
              }}
            />
          </div>

          <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border)" }} />

          <div style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column", textAlign: "left" }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
              {language === "en" ? "Check-out" : "Départ"}
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || new Date().toISOString().split("T")[0]}
              onChange={(e) => setCheckOut(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                padding: "2px 0",
                cursor: "pointer",
                width: "100%"
              }}
            />
          </div>

          <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border)" }} />

          {/* Voyageurs */}
          <div style={{ flex: 0.8, minWidth: "90px", display: "flex", flexDirection: "column", textAlign: "left" }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
              {language === "en" ? "Guests" : "Voyageurs"}
            </label>
            <input
              type="number"
              value={guests}
              min="1"
              max="20"
              placeholder="1"
              onChange={(e) => setGuests(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                padding: "2px 0",
                width: "100%"
              }}
            />
          </div>

          <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border)" }} />

          {/* Budget Max */}
          <div style={{ flex: 1, minWidth: "110px", display: "flex", flexDirection: "column", textAlign: "left" }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
              {language === "en" ? "Max Budget" : "Budget Max"}
            </label>
            <input
              type="number"
              value={maxBudget}
              placeholder="MAD / nuit"
              onChange={(e) => setMaxBudget(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                padding: "2px 0",
                width: "100%"
              }}
            />
          </div>
          
          <a
            href="#riads"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "var(--terracotta)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.15s",
              fontSize: "1.1rem",
              border: "none",
              textDecoration: "none"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            title={t("search_title")}
          >
            🔍
          </a>
        </div>
      </section>

      {/* 4. Contenu Principal */}
      <main className="main-container">
        {/* Section Riads Disponibles */}
        <section id="riads" style={{ padding: "60px 0" }}>
          <div className="section-header">
            <h2>{t("riads_title")}</h2>
            <p>
              {t("riads_desc")}
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
              <p style={{ fontSize: "1.1rem" }}>{t("loading_riads")}</p>
            </div>
          ) : (
            <div className="riads-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "32px 24px" }}>
              {filteredRiadsList.map((riad) => {
                const photos = riadPhotos[riad.id] || [];
                const avisInfo = riadAvis[riad.id] || { moy: 0, count: 0 };
                const mainPhoto = photos.length > 0 ? mapPhotoUrl(photos[0].url) : null;
                const minPrice =
                  riad.chambres?.length > 0
                    ? Math.min(
                        ...riad.chambres.map((c) => c.prixParNuit)
                      )
                    : riad.prixRiadEntier;

                const detailsUrl = currentUser ? `/client/riads/${riad.id}` : "/login";

                return (
                  <Link href={detailsUrl} key={riad.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <article style={{ display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer" }}>
                      {/* Image Container */}
                      <div style={{ position: "relative", width: "100%", aspectRatio: "20 / 19", borderRadius: "12px", overflow: "hidden", backgroundColor: "#e2e8f0" }}>
                        {mainPhoto ? (
                          <img
                            src={mainPhoto}
                            alt={riad.nom}
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.04)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", fontSize: "3rem", background: "linear-gradient(135deg, var(--terracotta), var(--majorelle))" }}>
                            🏡
                          </div>
                        )}
                      </div>

                      {/* Info Container */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {/* Title and Rating */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.98rem", color: "var(--text-primary)" }}>{riad.nom}</span>
                          {avisInfo.count > 0 && (
                            <span style={{ fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "3px", color: "var(--text-primary)", flexShrink: 0 }}>
                              ★ {avisInfo.moy}
                            </span>
                          )}
                        </div>

                        {/* Location */}
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{riad.ville}, Maroc</span>

                        {/* Chambres count */}
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{riad.chambres?.length ?? 0} {t("chambres_count")}</span>

                        {/* Services (Spa, Traiteur, Hammam) */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px", marginBottom: "4px" }}>
                          {riad.hasSpa && (
                            <span style={{ fontSize: "0.72rem", padding: "1px 6px", borderRadius: "10px", backgroundColor: "#f3e8ff", color: "#7c3aed", fontWeight: 600 }}>
                              🧖‍♀️ Spa
                            </span>
                          )}
                          {riad.hasHammam && (
                            <span style={{ fontSize: "0.72rem", padding: "1px 6px", borderRadius: "10px", backgroundColor: "#e0f2fe", color: "#0284c7", fontWeight: 600 }}>
                              🧼 Hammam
                            </span>
                          )}
                          {riad.hasTraiteur && (
                            <span style={{ fontSize: "0.72rem", padding: "1px 6px", borderRadius: "10px", backgroundColor: "#fef3c7", color: "#d97706", fontWeight: 600 }}>
                              🍽️ Traiteur
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <span style={{ fontSize: "0.92rem", marginTop: "2px", color: "var(--text-primary)" }}>
                          <strong style={{ fontWeight: 600 }}>{minPrice ?? "—"} MAD</strong> {t("per_night")}
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
              {filteredRiadsList.length === 0 && !loadingRiads && (
                <div
                  style={{
                    gridColumn: "span 12",
                    textAlign: "center",
                    padding: "40px",
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                  }}
                >
                  <p style={{ color: "var(--text-secondary)" }}>
                    {t("no_riads")}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>



        {/* Section Services Premium */}
        <section id="comment" style={{ padding: "40px 0 80px 0" }}>
          <div className="section-header">
            <h2>{t("services_title")}</h2>
            <p>
              {t("services_desc")}
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
                  color: "#7c3aed",
                  fontSize: "2.5rem",
                  marginBottom: "16px",
                }}
              >
                🧖‍♀️
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "12px", color: "var(--text-primary)" }}>
                {t("service_spa_title")}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  lineHeight: "1.6"
                }}
              >
                {t("service_spa_desc")}
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
                  color: "#0284c7",
                  fontSize: "2.5rem",
                  marginBottom: "16px",
                }}
              >
                🧼
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "12px", color: "var(--text-primary)" }}>
                {t("service_hammam_title")}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  lineHeight: "1.6"
                }}
              >
                {t("service_hammam_desc")}
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
                  color: "#d97706",
                  fontSize: "2.5rem",
                  marginBottom: "16px",
                }}
              >
                🍽️
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "12px", color: "var(--text-primary)" }}>
                {t("service_traiteur_title")}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  lineHeight: "1.6"
                }}
              >
                {t("service_traiteur_desc")}
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
              {t("footer_desc")}
            </p>
          </div>
          <div className="footer-col">
            <h4>{t("footer_destinations")}</h4>
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
            <h4>{t("footer_platform")}</h4>
            <ul className="footer-links">
              <li>
                <a href="#riads">{t("nav_riads")}</a>
              </li>
              <li>
                <a href="#comment">{t("nav_services")}</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t("footer_newsletter")}</h4>
            <p style={{ fontSize: "0.9rem", marginBottom: "16px" }}>
              {t("newsletter_desc")}
            </p>
            <form
              className="newsletter-form"
              onSubmit={(e) => {
                e.preventDefault();
                alert(t("newsletter_success"));
              }}
            >
              <input type="email" placeholder={t("newsletter_placeholder")} required />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "10px 16px" }}
              >
                {t("newsletter_btn")}
              </button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            {t("footer_rights")}
          </p>
          <p>{t("footer_motto")}</p>
        </div>
      </footer>
    </div>
  );
}
