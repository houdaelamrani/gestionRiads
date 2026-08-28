"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { mapPhotoUrl, API_BASE } from "../lib/api.js";
import { useLanguage } from "../lib/LanguageContext";
import { getNotifications, markNotificationsAsRead, getUnreadCount } from "../lib/NotificationSystem";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
  const [planningMap, setPlanningMap] = useState({}); // { riadId: [planningDates] }

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

        // Charger les chambres et planning de chaque riad
        const riadsWithChambres = await Promise.all(
          data.map(async (riad) => {
            let chambres = [];
            try {
              const chRes = await fetch(`${API_BASE}/api/riads/${riad.id}/chambres`);
              if (chRes.ok) {
                chambres = await chRes.json();
              }
            } catch (e) { /* silencieux */ }

            try {
              const planRes = await fetch(`${API_BASE}/api/riads/${riad.id}/planning-dates`);
              if (planRes.ok) {
                const planData = await planRes.json();
                setPlanningMap((prev) => ({ ...prev, [riad.id]: planData }));
              }
            } catch (e) { /* silencieux */ }

            return { ...riad, chambres };
          })
        );

        setRiads(riadsWithChambres);

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
      try {
        const user = JSON.parse(userStr);
        if (user.role === "PROPRIETAIRE" || user.role === "ADMIN") {
          setCurrentUser(user);
        } else {
          // Les clients n'ont pas besoin de compte
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setCurrentUser(null);
        }
      } catch (e) {
        setCurrentUser(null);
      }
    }
    fetchRiads();
  }, []);

  const handleCityFilter = (ville) => {
    setSelectedCity(ville);
    fetchRiads(ville);
  };

  const handleResetFilters = () => {
    setSelectedCity("Tous");
    setCheckIn("");
    setCheckOut("");
    setGuests("");
    setMaxBudget("");
    fetchRiads("Tous");
  };

  const handleSearchClick = (e) => {
    if (e) e.preventDefault();
    const el = document.getElementById("riads");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const hasActiveFilters = Boolean(
    (selectedCity && selectedCity !== "Tous") || checkIn || checkOut || guests || maxBudget
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  const renderStars = (note) => {
    const n = Math.round(note);
    return "★".repeat(n) + "☆".repeat(5 - n);
  };

  // Filtrage avancé côté client (Ville, Dates, Pax, Budget)
  const filteredRiadsList = riads.filter((riad) => {
    // 1. Filtrer par ville si spécifique
    if (selectedCity && selectedCity !== "Tous" && riad.ville) {
      if (riad.ville.toLowerCase() !== selectedCity.toLowerCase()) return false;
    }

    let matchingChambres = riad.chambres?.filter((c) => c.disponible !== false) || [];

    // 2. Filtrer par budget maximum (prix <= maxBudget)
    if (maxBudget && !isNaN(parseFloat(maxBudget))) {
      const limit = parseFloat(maxBudget);
      matchingChambres = matchingChambres.filter((c) => {
        const p = parseFloat(c.prixParNuit);
        return !isNaN(p) && p <= limit;
      });
      const riadEntierPrice = riad.prixRiadEntier ? parseFloat(riad.prixRiadEntier) : Infinity;
      if (matchingChambres.length === 0 && riadEntierPrice > limit) {
        return false;
      }
    }

    // 3. Filtrer par nombre de voyageurs (capacite >= guests)
    if (guests && !isNaN(parseInt(guests, 10))) {
      const numGuests = parseInt(guests, 10);
      matchingChambres = matchingChambres.filter((c) => {
        const cap = parseInt(c.capacite, 10);
        return !isNaN(cap) && cap >= numGuests;
      });
      const riadMaxCap = riad.capaciteMaximale ? parseInt(riad.capaciteMaximale, 10) : (riad.chambres?.reduce((acc, c) => acc + (parseInt(c.capacite, 10) || 0), 0) || 0);
      if (matchingChambres.length === 0 && riadMaxCap < numGuests) {
        return false;
      }
    }

    // 4. Filtrer par dates de séjour (Arrivée & Départ)
    if (checkIn && checkOut && checkIn < checkOut) {
      const plans = planningMap[riad.id] || [];
      const riadEntierOccupe = plans.some(
        (p) => p.riadEntier && !(checkOut <= p.dateDebut || checkIn >= p.dateFin)
      );
      if (riadEntierOccupe) return false;

      matchingChambres = matchingChambres.filter((ch) => {
        const chOccupee = plans.some(
          (p) => p.chambreId === ch.id && !(checkOut <= p.dateDebut || checkIn >= p.dateFin)
        );
        return !chOccupee;
      });

      if (riad.chambres?.length > 0 && matchingChambres.length === 0) {
        return false;
      }
    }

    return true;
  });

  return (
    <div>
      {/* 1. Navbar */}
      <Navbar activeTab={activeNavTab} />

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

          {/* Nombre de Pax */}
          <div style={{ flex: 0.8, minWidth: "90px", display: "flex", flexDirection: "column", textAlign: "left" }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
              {language === "en" ? "Pax" : "Pax"}
            </label>
            <input
              type="number"
              value={guests}
              min="1"
              max="20"
              placeholder="1 Pax"
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
          
          <button
            type="button"
            onClick={handleSearchClick}
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
              textDecoration: "none",
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            title={t("search_title")}
          >
            🔍
          </button>
        </div>
      </section>

      {/* 4. Contenu Principal */}
      <main className="main-container">
        {/* Section Riads Disponibles */}
        <section id="riads" style={{ padding: "40px 0 60px 0" }}>
          <div className="section-header" style={{ marginBottom: "24px" }}>
            <h2>{t("riads_title")}</h2>
            <p>
              {t("riads_desc")}
            </p>
          </div>

          {/* Barre d'état des filtres actifs */}
          {hasActiveFilters && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              backgroundColor: "#fff",
              padding: "14px 20px",
              borderRadius: "14px",
              border: "1px solid var(--border)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              marginBottom: "28px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "0.88rem", color: "var(--text-primary)" }}>
                <span style={{ fontWeight: 700, color: "var(--terracotta)" }}>
                  ✨ {filteredRiadsList.length} Riad(s) correspondant(s)
                </span>
                {selectedCity && selectedCity !== "Tous" && (
                  <span style={{ backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
                    📍 {selectedCity}
                  </span>
                )}
                {checkIn && checkOut && (
                  <span style={{ backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
                    📅 {checkIn} ➔ {checkOut}
                  </span>
                )}
                {guests && (
                  <span style={{ backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
                    👥 {guests} Pax
                  </span>
                )}
                {maxBudget && (
                  <span style={{ backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
                    💰 Max {maxBudget} MAD
                  </span>
                )}
              </div>

              <button
                onClick={handleResetFilters}
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                ✕ {language === "en" ? "Reset filters" : "Réinitialiser les filtres"}
              </button>
            </div>
          )}

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
                const availableChambres = riad.chambres?.filter((c) => c.disponible !== false) || [];
                const validPrices = availableChambres
                  .map((c) => parseFloat(c.prixParNuit))
                  .filter((p) => !isNaN(p));
                const minPrice = validPrices.length > 0
                  ? Math.min(...validPrices)
                  : (riad.prixRiadEntier ? parseFloat(riad.prixRiadEntier) : null);

                const queryParams = new URLSearchParams();
                if (checkIn) queryParams.set("checkIn", checkIn);
                if (checkOut) queryParams.set("checkOut", checkOut);
                if (guests) queryParams.set("pax", guests);
                if (maxBudget) queryParams.set("budget", maxBudget);
                const qStr = queryParams.toString();
                const detailsUrl = qStr ? `/client/riads/${riad.id}?${qStr}` : `/client/riads/${riad.id}`;

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
      <Footer onCityClick={handleCityFilter} />
    </div>
  );
}
