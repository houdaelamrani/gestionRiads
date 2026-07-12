"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:8080";

export default function ClientCatalogue() {
  const [currentUser, setCurrentUser] = useState(null);
  const [riads, setRiads] = useState([]);
  const [selectedCity, setSelectedCity] = useState("Tous");
  const [selectedRiad, setSelectedRiad] = useState(null);
  const [riadPhotos, setRiadPhotos] = useState({});
  const [riadAvis, setRiadAvis] = useState({});
  const [availableCities, setAvailableCities] = useState(["Tous"]);
  const [chambrePhotosMap, setChambrePhotosMap] = useState({}); // { chambreId: [photos] }

  // Modale de Réservation
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    dateDebut: "",
    dateFin: "",
    riadEntier: false,
    chambreIds: [],
    methodePaiement: "CARTE_BANCAIRE",
  });

  // Modale de Détails Riad
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRiad, setDetailRiad] = useState(null);
  const [detailPhotos, setDetailPhotos] = useState([]);
  const [detailAvis, setDetailAvis] = useState([]);
  const [detailChambres, setDetailChambres] = useState([]);
  const [activePhotoUrl, setActivePhotoUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchRiads();
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

      // Si c'est le chargement initial "Tous", extraire les villes uniques réelles
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

  const openBookingModal = async (riad, preSelectedChambreId = null, forceWholeRiad = false) => {
    // Récupérer les chambres fraîches en direct de la base de données
    let chambres = [];
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riad.id}/chambres`);
      if (res.ok) {
        chambres = await res.json();
      }
    } catch (e) {
      console.error("Erreur chargement chambres pour modale réservation:", e);
    }

    setSelectedRiad({ ...riad, chambres });
    setBookingForm({
      dateDebut: "",
      dateFin: "",
      riadEntier: forceWholeRiad,
      chambreIds: preSelectedChambreId ? [preSelectedChambreId] : [],
      methodePaiement: "CARTE_BANCAIRE",
    });
    setShowBookingModal(true);
    setError("");
    setSuccess("");
  };

  const handleChambreSelect = (chambreId) => {
    setBookingForm((prev) => {
      const ids = prev.chambreIds.includes(chambreId)
        ? prev.chambreIds.filter((id) => id !== chambreId)
        : [...prev.chambreIds, chambreId];
      return { ...prev, chambreIds: ids };
    });
  };

  const calculateNights = () => {
    if (!bookingForm.dateDebut || !bookingForm.dateFin) return 0;
    const start = new Date(bookingForm.dateDebut);
    const end = new Date(bookingForm.dateFin);
    const diffTime = end - start;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    if (nights <= 0) return 0;

    if (bookingForm.riadEntier) {
      return nights * (selectedRiad?.prixRiadEntier || 0);
    } else {
      const selectedChamberPrices = selectedRiad?.chambres
        ?.filter((c) => bookingForm.chambreIds.includes(c.id))
        ?.reduce((sum, c) => sum + c.prixParNuit, 0) || 0;
      return nights * selectedChamberPrices;
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.dateDebut || !bookingForm.dateFin) {
      setError("Veuillez sélectionner les dates de séjour.");
      return;
    }
    if (!bookingForm.riadEntier && bookingForm.chambreIds.length === 0) {
      setError("Veuillez sélectionner au moins une suite ou chambre.");
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        riadId: selectedRiad.id,
        dateDebut: bookingForm.dateDebut,
        dateFin: bookingForm.dateFin,
        riadEntier: bookingForm.riadEntier,
        chambreIds: bookingForm.riadEntier ? [] : bookingForm.chambreIds,
        methodePaiement: bookingForm.methodePaiement,
      };
      const res = await fetch(`${API_BASE}/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser.id,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Erreur lors de la réservation.");
      setSuccess("Réservation créée avec succès ! Retrouvez-la dans l'onglet 'Mes Réservations'.");
      setShowBookingModal(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailModal = async (riad) => {
    setDetailRiad(riad);
    setShowDetailModal(true);
    setDetailPhotos([]);
    setDetailAvis([]);
    setDetailChambres([]);
    setActivePhotoUrl(null);
    try {
      const [photosRes, avisRes, chambresRes] = await Promise.all([
        fetch(`${API_BASE}/api/riads/${riad.id}/photos`),
        fetch(`${API_BASE}/api/riads/${riad.id}/avis`),
        fetch(`${API_BASE}/api/riads/${riad.id}/chambres`),
      ]);
      if (photosRes.ok) {
        const pData = await photosRes.json();
        setDetailPhotos(pData);
        if (pData.length > 0) setActivePhotoUrl(pData[0].url);
      }
      if (avisRes.ok) setDetailAvis(await avisRes.json());
      if (chambresRes.ok) {
        const cData = await chambresRes.json();
        setDetailChambres(cData);
        // Charger les photos de chaque chambre
        cData.forEach(async (ch) => {
          try {
            const photoRes = await fetch(`${API_BASE}/api/chambres/${ch.id}/photos`);
            if (photoRes.ok) {
              const pData = await photoRes.json();
              setChambrePhotosMap((prev) => ({ ...prev, [ch.id]: pData }));
            }
          } catch (e) {}
        });
      }
    } catch (e) {
      console.error("Erreur détails Riad:", e);
    }
  };

  const renderStars = (note) => {
    return "★".repeat(Math.round(note)) + "☆".repeat(5 - Math.round(note));
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Notifications */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#ef4444", marginBottom: "20px", fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#10b981", marginBottom: "20px", fontWeight: 500 }}>
          ✅ {success}
        </div>
      )}

      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "2.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
          Découvrez nos Riads
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
          Sélectionnez un riad pour le réserver directement.
        </p>
      </div>

      {/* Filtre par ville étendu */}
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
            {city}
          </button>
        ))}
      </div>

      {/* Grille de riads */}
      {riads.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "1.1rem" }}>Aucun riad disponible dans cette zone pour le moment.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "28px" }}>
          {riads.map((riad) => {
            const photos = riadPhotos[riad.id] || [];
            const avisInfo = riadAvis[riad.id] || { moy: 0, count: 0 };
            const mainPhoto = photos.length > 0 ? photos[0].url : null;

            return (
              <div
                key={riad.id}
                className="card"
                style={{ overflow: "hidden", transition: "transform 0.2s", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div
                  onClick={() => openDetailModal(riad)}
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
                      📷 {photos.length} photos
                    </span>
                  )}
                </div>
                <div style={{ padding: "20px" }}>
                  <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                    {riad.nom}
                  </h3>
                  <div style={{ display: "flex", justifySpace: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
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
                      À partir de {riad.chambres?.[0]?.prixParNuit ?? "—"} MAD/nuit
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {riad.chambres?.length ?? 0} chambre(s)
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => openBookingModal(riad)} className="btn btn-primary" style={{ flex: 1, padding: "12px" }}>
                      Réserver
                    </button>
                    <button onClick={() => openDetailModal(riad)} className="btn btn-secondary" style={{ padding: "12px 16px", border: "1px solid var(--border)" }}>
                      Détails & Catalogue
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal de Réservation (Refactorisé) ────────────────────────────────── */}
      {showBookingModal && selectedRiad && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", padding: "32px", borderRadius: "16px", backgroundColor: "#ffffff", color: "var(--text-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
                🛎️ Réserver — {selectedRiad.nom}
              </h2>
              <button onClick={() => setShowBookingModal(false)} style={{ background: "none", border: "none", fontSize: "1.8rem", cursor: "pointer", color: "var(--text-secondary)" }}>×</button>
            </div>

            <form onSubmit={handleBookingSubmit}>
              {/* Étape 1 : Dates */}
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "10px" }}>📅 Étape 1 : Dates de votre séjour</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Date d'arrivée</label>
                    <input
                      type="date"
                      className="form-input-control"
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingForm.dateDebut}
                      onChange={(e) => setBookingForm((p) => ({ ...p, dateDebut: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Date de départ</label>
                    <input
                      type="date"
                      className="form-input-control"
                      min={bookingForm.dateDebut || new Date().toISOString().split("T")[0]}
                      value={bookingForm.dateFin}
                      onChange={(e) => setBookingForm((p) => ({ ...p, dateFin: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Étape 2 : Formule */}
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "10px" }}>🏡 Étape 2 : Formule d'hébergement</p>
                
                {/* Switcher Riad Entier / Chambres */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setBookingForm((p) => ({ ...p, riadEntier: false }))}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: `2px solid ${!bookingForm.riadEntier ? "var(--majorelle)" : "var(--border)"}`,
                      background: !bookingForm.riadEntier ? "rgba(88,86,214,0.06)" : "transparent",
                      color: !bookingForm.riadEntier ? "var(--majorelle)" : "var(--text-secondary)",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.88rem",
                      transition: "all 0.2s"
                    }}
                  >
                    🛏️ Chambres/Suites
                  </button>
                  <button
                    type="button"
                    disabled={!selectedRiad.prixRiadEntier}
                    onClick={() => setBookingForm((p) => ({ ...p, riadEntier: true, chambreIds: [] }))}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: `2px solid ${bookingForm.riadEntier ? "var(--terracotta)" : "var(--border)"}`,
                      background: bookingForm.riadEntier ? "rgba(176,91,59,0.06)" : "transparent",
                      color: bookingForm.riadEntier ? "var(--terracotta)" : "var(--text-secondary)",
                      fontWeight: 600,
                      cursor: selectedRiad.prixRiadEntier ? "pointer" : "not-allowed",
                      fontSize: "0.88rem",
                      opacity: selectedRiad.prixRiadEntier ? 1 : 0.5,
                      transition: "all 0.2s"
                    }}
                  >
                    🏰 Riad Entier
                  </button>
                </div>

                {bookingForm.riadEntier ? (
                  <div style={{ background: "rgba(176,91,59,0.08)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(176,91,59,0.2)" }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Privatisation totale du Riad</p>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Inclus l'accès exclusif à toutes les chambres, patio et piscine.</span>
                    <strong style={{ display: "block", marginTop: "8px", color: "var(--terracotta)", fontSize: "1.1rem" }}>{selectedRiad.prixRiadEntier} MAD / nuit</strong>
                  </div>
                ) : (
                  <div>
                    {selectedRiad.chambres?.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {selectedRiad.chambres.map((ch) => (
                          <label key={ch.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "8px", border: `1.5px solid ${bookingForm.chambreIds.includes(ch.id) ? "var(--majorelle)" : "var(--border)"}`, background: bookingForm.chambreIds.includes(ch.id) ? "rgba(88,86,214,0.04)" : "transparent", cursor: "pointer", transition: "all 0.2s" }}>
                            <input
                              type="checkbox"
                              checked={bookingForm.chambreIds.includes(ch.id)}
                              onChange={() => handleChambreSelect(ch.id)}
                              style={{ width: "16px", height: "16px", accentColor: "var(--majorelle)" }}
                            />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{ch.nomChambre}</span>
                              <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)" }}>{ch.typeChambre} · {ch.capacite} pers.</span>
                            </div>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{ch.prixParNuit} MAD</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>Aucune chambre configurée pour ce riad.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Étape 3 : Paiement */}
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "8px", display: "block" }}>💳 Étape 3 : Mode de paiement</label>
                <select
                  className="form-input-control"
                  value={bookingForm.methodePaiement}
                  onChange={(e) => setBookingForm((p) => ({ ...p, methodePaiement: e.target.value }))}
                >
                  <option value="CARTE_BANCAIRE">💳 Carte Bancaire (confirmation immédiate)</option>
                  <option value="PAYPAL">🅿️ PayPal (confirmation immédiate)</option>
                  <option value="SUR_PLACE">💵 Espèces sur place (en attente propriétaire)</option>
                </select>
              </div>

              {/* Résumé du prix dynamique */}
              {calculateNights() > 0 && (
                <div style={{ background: "var(--bg-secondary)", padding: "16px 20px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Séjour de :</span>
                    <strong style={{ display: "block", fontSize: "1rem", color: "var(--text-primary)" }}>{calculateNights()} nuit(s)</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Prix Total :</span>
                    <strong style={{ display: "block", fontSize: "1.3rem", color: "var(--terracotta)" }}>{calculateTotal()} MAD</strong>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1rem", fontWeight: 600 }} disabled={actionLoading}>
                {actionLoading ? "Création du dossier..." : "Confirmer la Réservation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Détails Riad & Catalogue de Chambres (Refactorisé) ─────────── */}
      {showDetailModal && detailRiad && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", padding: "32px", borderRadius: "16px", backgroundColor: "#ffffff", color: "var(--text-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <div>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {detailRiad.nom}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "2px" }}>📍 {detailRiad.adresse}, {detailRiad.ville}</p>
              </div>
              <button onClick={() => { setShowDetailModal(false); setDetailPhotos([]); setDetailAvis([]); setDetailChambres([]); }} style={{ background: "none", border: "none", fontSize: "1.8rem", cursor: "pointer", color: "var(--text-secondary)" }}>×</button>
            </div>

            {/* Photos Galerie Clignotante / Carrousel moderne */}
            {detailPhotos.length > 0 && (
              <div style={{ marginBottom: "28px" }}>
                <div style={{ height: "340px", borderRadius: "12px", overflow: "hidden", background: "#f3f4f6", marginBottom: "12px" }}>
                  <img src={activePhotoUrl} alt="Visualisation Riad" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "all 0.3s" }} />
                </div>
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
                  {detailPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setActivePhotoUrl(photo.url)}
                      style={{
                        width: "80px",
                        height: "60px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: `2.5px solid ${activePhotoUrl === photo.url ? "var(--terracotta)" : "transparent"}`,
                        padding: 0,
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.2s"
                      }}
                    >
                      <img src={photo.url} alt="Miniature" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "28px" }}>
              <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.6 }}>{detailRiad.description}</p>
            </div>

            {/* Catalogue de Chambres / Suites */}
            <div style={{ marginBottom: "28px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h4 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.25rem", color: "var(--text-primary)", margin: 0 }}>
                  🛏️ Catalogue des Chambres & Suites
                </h4>
                {detailRiad.prixRiadEntier && (
                  <button
                    onClick={() => { setShowDetailModal(false); openBookingModal(detailRiad, null, true); }}
                    className="btn btn-secondary"
                    style={{ padding: "8px 16px", fontSize: "0.82rem", borderColor: "var(--terracotta)", color: "var(--terracotta)" }}
                  >
                    🏰 Privatiser Riad Entier ({detailRiad.prixRiadEntier} MAD)
                  </button>
                )}
              </div>

              {detailChambres.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", textAlign: "center", padding: "20px 0" }}>Aucune chambre disponible dans ce riad.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {detailChambres.map((ch) => {
                    const chPhotos = chambrePhotosMap[ch.id] || [];
                    const chPhotoUrl = chPhotos.length > 0 ? chPhotos[0].url : null;

                    return (
                      <div
                        key={ch.id}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: "12px",
                          padding: "16px",
                          background: "var(--bg-secondary)",
                          display: "flex",
                          gap: "16px",
                          alignItems: "stretch"
                        }}
                      >
                        {chPhotoUrl && (
                          <div style={{ width: "120px", height: "100px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                            <img src={chPhotoUrl} alt={ch.nomChambre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                              <strong style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>{ch.nomChambre}</strong>
                              <span style={{ fontSize: "0.72rem", background: "rgba(88,86,214,0.12)", color: "var(--majorelle)", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>{ch.typeChambre}</span>
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0" }}>Capacité : {ch.capacite} pers.</p>
                            {ch.description && <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: "4px 0" }}>{ch.description}</p>}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "8px" }}>
                            <strong style={{ color: "var(--terracotta)", fontSize: "0.9rem" }}>{ch.prixParNuit} MAD <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)" }}>/nuit</span></strong>
                            <button
                              onClick={() => { setShowDetailModal(false); openBookingModal(detailRiad, ch.id); }}
                              className="btn btn-primary"
                              style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                            >
                              Réserver
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Avis */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
              <h4 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "16px" }}>⭐ Avis voyageurs ({detailAvis.length})</h4>
              {detailAvis.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>Aucun avis déposé pour le moment.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {detailAvis.map((avis) => (
                    <div key={avis.id} style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                          {avis.client?.prenom} {avis.client?.nom}
                        </span>
                        <span style={{ color: "#f59e0b", fontSize: "0.9rem" }}>{renderStars(avis.note)}</span>
                      </div>
                      {avis.commentaire && <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5 }}>{avis.commentaire}</p>}
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "8px", opacity: 0.7 }}>
                        {avis.dateCreation ? new Date(avis.dateCreation).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
