"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mapPhotoUrl, API_BASE } from "../../../lib/api.js";
import { useLanguage } from "../../../lib/LanguageContext";

export default function ClientCatalogue() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [riads, setRiads] = useState([]);
  const [selectedCity, setSelectedCity] = useState("Tous");
  const [riadPhotos, setRiadPhotos] = useState({});
  const [riadAvis, setRiadAvis] = useState({});
  const [availableCities, setAvailableCities] = useState(["Tous"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // États pour recherche avancée
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    
    const params = new URLSearchParams(window.location.search);
    const villeParam = params.get("ville") || "Tous";
    setSelectedCity(villeParam);
    fetchRiads(villeParam);
  }, []);

  const fetchRiads = async (ville = "Tous") => {
    setLoading(true);
    try {
      const url =
        ville === "Tous"
          ? `${API_BASE}/api/riads/recherche`
          : `${API_BASE}/api/riads/recherche?ville=${encodeURIComponent(ville)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Impossible de charger les riads.");
      const data = await res.json();
      setRiads(data);

      if (ville === "Tous") {
        const uniqueCities = [...new Set(data.map((r) => r.ville))];
        setAvailableCities(["Tous", ...uniqueCities]);
      }

      data.forEach((riad) => {
        fetchRiadPhotosCatalogue(riad.id);
        fetchRiadAvisCatalogue(riad.id);
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiadPhotosCatalogue = async (riadId) => {
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riadId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setRiadPhotos((prev) => ({ ...prev, [riadId]: data }));
      }
    } catch (e) {}
  };

  const fetchRiadAvisCatalogue = async (riadId) => {
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riadId}/avis`);
      if (res.ok) {
        const data = await res.json();
        const count = data.length;
        const moy =
          count > 0
            ? (data.reduce((sum, a) => sum + a.note, 0) / count).toFixed(1)
            : 0;
        setRiadAvis((prev) => ({ ...prev, [riadId]: { moy, count } }));
      }
    } catch (e) {}
  };

  const handleCityFilter = (ville) => {
    setSelectedCity(ville);
    fetchRiads(ville);
  };

  const renderStars = (note) => {
    return "★".repeat(Math.round(note)) + "☆".repeat(5 - Math.round(note));
  };

  // Filtrage avancé côté client
  const filteredRiadsList = riads.filter((riad) => {
    const availableChambres = riad.chambres?.filter((c) => c.disponible !== false) || [];
    if (maxBudget) {
      const budgetLimit = parseFloat(maxBudget);
      const minPrice = availableChambres.length > 0
        ? Math.min(...availableChambres.map((c) => c.prixParNuit))
        : riad.prixRiadEntier;
      if (minPrice > budgetLimit) return false;
    }
    if (guests) {
      const requiredCapacity = parseInt(guests);
      if (availableChambres.length > 0) {
        const hasCapacity = availableChambres.some((c) => c.capacite >= requiredCapacity);
        if (!hasCapacity) return false;
      } else if (riad.capaciteMaximale && riad.capaciteMaximale < requiredCapacity) {
        return false;
      }
    }
    return true;
  });


  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#ef4444", marginBottom: "20px", fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "2.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
          {t("catalogue_title")}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
          {t("catalogue_subtitle")}
        </p>
      </div>

      {/* Barre de recherche avancée */}
      <div style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {/* Ville Select */}
        <div style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "4px" }}>
            {t("search_destination")}
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleCityFilter(e.target.value)}
            style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.85rem", outline: "none", cursor: "pointer", backgroundColor: "#fff" }}
          >
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city === "Tous" ? (language === "en" ? "All Anywhere" : "Partout") : city}
              </option>
            ))}
          </select>
        </div>

        {/* Check In */}
        <div style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "4px" }}>
            {language === "en" ? "Check-in" : "Arrivée"}
          </label>
          <input
            type="date"
            value={checkIn}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setCheckIn(e.target.value)}
            style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.85rem", outline: "none" }}
          />
        </div>

        {/* Check Out */}
        <div style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "4px" }}>
            {language === "en" ? "Check-out" : "Départ"}
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn || new Date().toISOString().split("T")[0]}
            onChange={(e) => setCheckOut(e.target.value)}
            style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.85rem", outline: "none" }}
          />
        </div>

        {/* Guests */}
        <div style={{ flex: 0.8, minWidth: "80px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "4px" }}>
            {language === "en" ? "Guests" : "Voyageurs"}
          </label>
          <input
            type="number"
            value={guests}
            min="1"
            placeholder="1"
            onChange={(e) => setGuests(e.target.value)}
            style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.85rem", outline: "none" }}
          />
        </div>

        {/* Budget */}
        <div style={{ flex: 1, minWidth: "100px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "4px" }}>
            {language === "en" ? "Max Budget (MAD)" : "Budget Max (MAD)"}
          </label>
          <input
            type="number"
            value={maxBudget}
            placeholder="Ex: 800"
            onChange={(e) => setMaxBudget(e.target.value)}
            style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.85rem", outline: "none" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "32px" }}>
        {availableCities.map((city) => (
          <button
            key={city}
            onClick={() => handleCityFilter(city)}
            style={{
              padding: "8px 18px",
              borderRadius: "30px",
              border: "1px solid",
              borderColor: selectedCity === city ? "var(--terracotta)" : "var(--border)",
              background: selectedCity === city ? "var(--terracotta)" : "transparent",
              color: selectedCity === city ? "white" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            {city === "Tous" ? (language === "en" ? "All" : "Tous") : city}
          </button>
        ))}
      </div>

      {filteredRiadsList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "1.1rem" }}>{t("no_riads_zone")}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "28px" }}>
          {filteredRiadsList.map((riad) => {
            const photos = riadPhotos[riad.id] || [];
            const avisInfo = riadAvis[riad.id] || { moy: 0, count: 0 };
            const mainPhoto = photos.length > 0 ? mapPhotoUrl(photos[0].url) : null;

            return (
              <div
                key={riad.id}
                className="card"
                onClick={() => router.push(`/client/riads/${riad.id}`)}
                style={{ overflow: "hidden", transition: "transform 0.2s", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div
                  style={{
                    height: "200px",
                    background: mainPhoto
                      ? `url(${mainPhoto}) center/cover no-repeat`
                      : "linear-gradient(135deg, var(--terracotta), var(--majorelle))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: mainPhoto ? "0" : "4rem",
                    position: "relative",
                  }}
                >
                  {!mainPhoto && "🏡"}
                  {photos.length > 1 && (
                    <span style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.6)", color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 }}>
                      📷 {photos.length} {t("photos_count")}
                    </span>
                  )}
                </div>
                <div style={{ padding: "20px" }}>
                  <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                    {riad.nom}
                  </h3>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>📍 {riad.ville}</p>
                    {avisInfo.count > 0 && (
                      <span style={{ color: "#f59e0b", fontSize: "0.85rem", fontWeight: 600 }}>
                        {renderStars(avisInfo.moy)} <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.8rem" }}>({avisInfo.count})</span>
                      </span>
                    )}
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "16px" }}>
                    {riad.description?.substring(0, 100)}...
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontWeight: 700, color: "var(--terracotta)", fontSize: "1.05rem" }}>
                      {t("starting_from")} {riad.chambres?.[0]?.prixParNuit ?? "—"} MAD/{t("per_night")}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {riad.chambres?.length ?? 0} {t("rooms_count")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-primary" style={{ flex: 1, padding: "12px" }}>
                      {t("view_rooms")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


