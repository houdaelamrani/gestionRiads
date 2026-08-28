"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mapPhotoUrl, API_BASE } from "../../../../lib/api.js";
import { useLanguage } from "../../../../lib/LanguageContext";
import AvailabilityCalendar from "../../../../components/AvailabilityCalendar";

export default function RiadDetailPage({ params }) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const resolvedParams = use(params);
  const riadId = resolvedParams.id;

  // États Riad et Chambres
  const [riad, setRiad] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [chambrePhotosMap, setChambrePhotosMap] = useState({});
  const [planningDates, setPlanningDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modale de réservation
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isRiadEntierBooking, setIsRiadEntierBooking] = useState(false);

  // Coordonnées Invité (Sans compte requis)
  const [guestNom, setGuestNom] = useState("");
  const [guestPrenom, setGuestPrenom] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Dates & Paiement
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [methodePaiement, setMethodePaiement] = useState("SUR_PLACE");

  // Carte bancaire (si sélectionné)
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // États d'action & notification après réservation
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [recentBookingNotification, setRecentBookingNotification] = useState(null);

  // Date du jour pour désactiver les jours passés
  const todayStr = new Date().toISOString().split("T")[0];

  // Normaliser les chaînes de dates en format ISO YYYY-MM-DD
  const normalizeToIsoDate = (dStr) => {
    if (!dStr) return "";
    if (dStr.includes("/")) {
      const p = dStr.split("/");
      if (p.length === 3) {
        return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
      }
    }
    return dStr;
  };

  // Chargement ultra-rapide des données
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const ci = sp.get("checkIn") || "";
      const co = sp.get("checkOut") || "";
      if (ci) setDateDebut(normalizeToIsoDate(ci));
      if (co) setDateFin(normalizeToIsoDate(co));

      const savedEmail = localStorage.getItem("guest_email");
      if (savedEmail) setGuestEmail(savedEmail);
      const savedNom = localStorage.getItem("guest_nom");
      if (savedNom) setGuestNom(savedNom);
      const savedPrenom = localStorage.getItem("guest_prenom");
      if (savedPrenom) setGuestPrenom(savedPrenom);
      const savedPhone = localStorage.getItem("guest_phone");
      if (savedPhone) setGuestPhone(savedPhone);
    }

    loadRiadAndRooms();
  }, [riadId]);

  const loadRiadAndRooms = async () => {
    setLoading(true);
    setError("");
    try {
      // Appels parallèles pour afficher le Riad, ses chambres et son planning de dates
      const [riadRes, roomsRes, planRes] = await Promise.all([
        fetch(`${API_BASE}/api/riads/${riadId}`),
        fetch(`${API_BASE}/api/riads/${riadId}/chambres`),
        fetch(`${API_BASE}/api/riads/${riadId}/planning-dates`),
      ]);

      if (!riadRes.ok) throw new Error(t("riad_not_found") || "Riad introuvable");
      const riadData = await riadRes.json();
      setRiad(riadData);

      if (planRes.ok) {
        const planData = await planRes.json();
        setPlanningDates(planData);
      }

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);

        // Charger les photos des chambres en tâche de fond
        roomsData.forEach(async (ch) => {
          try {
            const photoRes = await fetch(`${API_BASE}/api/chambres/${ch.id}/photos`);
            if (photoRes.ok) {
              const pData = await photoRes.json();
              if (pData && pData.length > 0) {
                setChambrePhotosMap((prev) => ({ ...prev, [ch.id]: pData }));
              }
            }
          } catch (e) {}
        });
      }
    } catch (e) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  // Calcul du nombre de nuits
  const calculateNights = () => {
    if (!dateDebut || !dateFin) return 1;
    const iso1 = normalizeToIsoDate(dateDebut);
    const iso2 = normalizeToIsoDate(dateFin);
    const d1 = new Date(iso1);
    const d2 = new Date(iso2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  // Calcul du prix total
  const calculateTotalPrice = () => {
    const nights = calculateNights();
    if (isRiadEntierBooking) {
      const price = parseFloat(riad?.prixRiadEntier) || 0;
      return price * nights;
    }
    if (selectedRoom) {
      const price = parseFloat(selectedRoom.prixParNuit) || 0;
      return price * nights;
    }
    return 0;
  };

  // Nom de la chambre sélectionnée
  const getSelectedRoomName = () => {
    if (isRiadEntierBooking) {
      return language === "en" ? "Entire Riad" : "Riad Entier";
    }
    if (!selectedRoom) return language === "en" ? "Room" : "Chambre";
    return selectedRoom.nomChambre || selectedRoom.nom || selectedRoom.typeChambre || (language === "en" ? "Room" : "Chambre");
  };

  // Ouvrir la modale pour réserver une chambre spécifique
  const handleOpenRoomBooking = (room) => {
    setSelectedRoom(room);
    setIsRiadEntierBooking(false);
    setBookingError("");
    setBookingSuccessData(null);
    setShowBookingModal(true);
  };

  // Ouvrir la modale pour privatiser le riad entier
  const handleOpenEntireRiadBooking = () => {
    setSelectedRoom(null);
    setIsRiadEntierBooking(true);
    setBookingError("");
    setBookingSuccessData(null);
    setShowBookingModal(true);
  };

  // Soumission de la réservation
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setBookingError("");

    const isoDateDebut = normalizeToIsoDate(dateDebut);
    const isoDateFin = normalizeToIsoDate(dateFin);

    if (!isoDateDebut || !isoDateFin) {
      setBookingError(language === "en" ? "Please select your check-in and check-out dates." : "Veuillez renseigner vos dates d'arrivée et de départ.");
      return;
    }

    if (isoDateDebut < todayStr) {
      setBookingError(language === "en" ? "Check-in date cannot be in the past." : "La date d'arrivée ne peut pas être dans le passé.");
      return;
    }

    if (isoDateFin <= isoDateDebut) {
      setBookingError(language === "en" ? "Check-out date must be after check-in date." : "La date de départ doit être postérieure à la date d'arrivée.");
      return;
    }

    if (!guestNom.trim() || !guestPrenom.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setBookingError(language === "en" ? "Please provide your full name, email, and phone number." : "Veuillez renseigner vos nom, prénom, email et téléphone.");
      return;
    }

    if (methodePaiement === "CARTE_BANCAIRE") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        setBookingError(language === "en" ? "Please fill in all credit card details." : "Veuillez renseigner toutes les informations de votre carte bancaire.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        riadId: riad.id,
        dateDebut: isoDateDebut,
        dateFin: isoDateFin,
        riadEntier: isRiadEntierBooking,
        chambreIds: isRiadEntierBooking ? [] : [selectedRoom.id],
        methodePaiement,
        nom: guestNom.trim(),
        prenom: guestPrenom.trim(),
        email: guestEmail.trim(),
        telephone: guestPhone.trim(),
      };

      const res = await fetch(`${API_BASE}/api/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (language === "en" ? "Failed to create reservation." : "Impossible d'effectuer la réservation."));
      }

      // Sauvegarder les informations de contact
      if (typeof window !== "undefined") {
        localStorage.setItem("guest_email", guestEmail.trim());
        localStorage.setItem("guest_nom", guestNom.trim());
        localStorage.setItem("guest_prenom", guestPrenom.trim());
        localStorage.setItem("guest_phone", guestPhone.trim());
      }

      const bookedRoomName = getSelectedRoomName();
      const resultingStatus = methodePaiement === "SUR_PLACE" ? "RESERVEE" : "OCCUPEE";

      // 1. Recharger immédiatement les chambres pour afficher leur nouvel état
      await loadRiadAndRooms();

      // 2. Définir le récapitulatif de succès
      setBookingSuccessData({
        reservation: data,
        roomName: bookedRoomName,
        total: calculateTotalPrice(),
        nights: calculateNights(),
        dateDebutFormatted: isoDateDebut,
        dateFinFormatted: isoDateFin,
        statut: resultingStatus,
        methodePaiement,
      });

      // 3. Réinitialiser les champs de date pour toute future réservation
      setDateDebut("");
      setDateFin("");
      setCardNumber("");
      setCardName("");
      setCardExpiry("");
      setCardCvv("");
    } catch (err) {
      setBookingError(err.message || "Erreur lors de la réservation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccessAndShowRooms = () => {
    setShowBookingModal(false);
    setBookingSuccessData(null);
    setDateDebut("");
    setDateFin("");
    const element = document.getElementById("chambres-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)", fontWeight: 600 }}>
            {language === "en" ? "Loading Riad & Rooms..." : "Chargement du Riad et des chambres..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !riad) {
    return (
      <div style={{ maxWidth: "800px", margin: "60px auto", padding: "30px", textAlign: "center", background: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <h2 style={{ color: "#ef4444", marginBottom: "12px" }}>⚠️ {language === "en" ? "Riad Not Found" : "Riad Introuvable"}</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>{error || t("riad_not_found")}</p>
        <Link href="/" className="btn btn-primary">
          {language === "en" ? "Back to Home" : "Retour à l'accueil"}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 20px 60px 20px" }}>

      {/* 1. EN-TÊTE DU RIAD (Nom, Services & Option Riad Entier) */}
      <div style={{
        background: "#ffffff",
        borderRadius: "24px",
        padding: "36px 32px",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
        marginBottom: "36px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          {/* Nom du Riad */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.8rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
            lineHeight: 1.15
          }}>
            {riad.nom}
          </h1>

          {/* Badges des Services du Riad */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {riad.hasSpa && (
              <span style={{ fontSize: "0.9rem", padding: "8px 16px", borderRadius: "14px", backgroundColor: "#f3e8ff", color: "#7c3aed", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e9d5ff" }}>
                🧖‍♀️ Spa & Massage
              </span>
            )}
            {riad.hasHammam && (
              <span style={{ fontSize: "0.9rem", padding: "8px 16px", borderRadius: "14px", backgroundColor: "#e0f2fe", color: "#0284c7", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", border: "1px solid #bae6fd" }}>
                🧼 Hammam Traditionnel
              </span>
            )}
            {riad.hasTraiteur && (
              <span style={{ fontSize: "0.9rem", padding: "8px 16px", borderRadius: "14px", backgroundColor: "#fef3c7", color: "#d97706", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", border: "1px solid #fde68a" }}>
                🍽️ Table d'Hôtes & Traiteur
              </span>
            )}
          </div>
        </div>

        {/* Option Réservation du Riad Entier */}
        {riad.prixRiadEntier && (
          <div style={{
            marginTop: "28px",
            padding: "24px 28px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, rgba(217, 107, 67, 0.08) 0%, rgba(15, 82, 186, 0.06) 100%)",
            border: "1.5px solid rgba(217, 107, 67, 0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "1.25rem" }}>✨</span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  {language === "en" ? "Privatize the Entire Riad" : "Réservation du Riad Entier"}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--text-secondary)", maxWidth: "650px", lineHeight: 1.45 }}>
                {language === "en"
                  ? "Enjoy exclusive private access to all suites, rooms, patio, and amenities for your group or family."
                  : "Profitez de l'intégralité du riad, du patio et des services en toute intimité pour votre groupe ou famille."}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--terracotta)" }}>
                  {riad.prixRiadEntier} MAD
                </span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block" }}>
                  / {language === "en" ? "night" : "nuit"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenEntireRiadBooking}
                className="btn btn-primary"
                style={{ padding: "12px 26px", fontSize: "0.95rem", fontWeight: 700, borderRadius: "12px" }}
              >
                {language === "en" ? "Book Entire Riad" : "Réserver le Riad Entier"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. BANNIÈRE DE NOTIFICATION APRÈS RÉSERVATION */}
      {recentBookingNotification && (
        <div style={{
          backgroundColor: recentBookingNotification.statut === "RESERVEE" ? "#fffbeb" : "#ecfdf5",
          border: `1.5px solid ${recentBookingNotification.statut === "RESERVEE" ? "#fde68a" : "#a7f3d0"}`,
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "32px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "2rem" }}>
              {recentBookingNotification.statut === "RESERVEE" ? "🟡" : "✅"}
            </span>
            <div>
              <h4 style={{
                margin: "0 0 6px 0",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: recentBookingNotification.statut === "RESERVEE" ? "#92400e" : "#065f46"
              }}>
                {recentBookingNotification.statut === "RESERVEE"
                  ? (language === "en" ? "Reservation Registered — Status: Reserved (Advance Required)" : "Réservation Enregistrée — Statut : Réservée (Acompte requis)")
                  : (language === "en" ? "Reservation Confirmed — Status: Occupied" : "Réservation Confirmée — Statut : Occupée")}
              </h4>
              <p style={{
                margin: 0,
                fontSize: "0.92rem",
                color: recentBookingNotification.statut === "RESERVEE" ? "#b45309" : "#047857",
                lineHeight: 1.5
              }}>
                {recentBookingNotification.statut === "RESERVEE"
                  ? `La réservation pour « ${recentBookingNotification.roomName} » du ${recentBookingNotification.dateDebut} au ${recentBookingNotification.dateFin} a bien été enregistrée. Son statut est maintenant « Réservée » (veuillez verser l'avance/acompte avant le début du séjour). La liste ci-dessous a été actualisée.`
                  : `La réservation pour « ${recentBookingNotification.roomName} » du ${recentBookingNotification.dateDebut} au ${recentBookingNotification.dateFin} a été réglée avec succès. Son statut est maintenant « Occupée ». La liste ci-dessous a été actualisée.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRecentBookingNotification(null)}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.3rem",
              cursor: "pointer",
              color: recentBookingNotification.statut === "RESERVEE" ? "#92400e" : "#065f46"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. SECTION DE LA LISTE DES CHAMBRES */}
      <div id="chambres-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.85rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 6px 0"
            }}>
              {language === "en" ? "Rooms & Suites of this Riad" : "Chambres & Suites de ce Riad"}
            </h2>
            <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.94rem" }}>
              {language === "en"
                ? "Select your room and book your stay."
                : "Sélectionnez votre chambre et réservez votre séjour."}
            </p>
          </div>
          <span style={{
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "var(--text-secondary)",
            backgroundColor: "#fff",
            padding: "8px 18px",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}>
            {rooms.length} {rooms.length > 1 ? (language === "en" ? "rooms" : "chambres") : (language === "en" ? "room" : "chambre")}
          </span>
        </div>

        {rooms.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "#fff",
            borderRadius: "18px",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)"
          }}>
            <p style={{ fontSize: "1.1rem", margin: 0 }}>
              {language === "en" ? "No rooms currently available for this Riad." : "Aucune chambre disponible pour le moment dans ce Riad."}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: "26px"
          }}>
            {rooms.map((room) => {
              const photos = chambrePhotosMap[room.id] || [];
              const mainPhoto = photos.length > 0 ? mapPhotoUrl(photos[0].url) : null;
              const roomDisplayName = room.nomChambre || room.nom || room.typeChambre || "Chambre";

              return (
                <div
                  key={room.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "18px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 18px rgba(0, 0, 0, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.2s, box-shadow 0.2s"
                  }}
                >
                  {/* Photo de la chambre avec type */}
                  <div>
                    <div style={{ position: "relative", width: "100%", height: "210px", backgroundColor: "#e2e8f0", overflow: "hidden" }}>
                      {mainPhoto ? (
                        <img
                          src={mainPhoto}
                          alt={roomDisplayName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)", fontSize: "2.8rem" }}>
                          🛏️
                        </div>
                      )}

                      {/* Type de chambre */}
                      <span style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        color: "#fff",
                        padding: "5px 12px",
                        borderRadius: "12px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        backdropFilter: "blur(4px)"
                      }}>
                        {room.typeChambre || "Standard"}
                      </span>
                    </div>

                    {/* Détails essentiels de la chambre */}
                    <div style={{ padding: "22px" }}>
                      <h3 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        margin: "0 0 8px 0",
                        color: "var(--text-primary)"
                      }}>
                        {roomDisplayName}
                      </h3>

                      <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "12px" }}>
                        <span>{room.capacite || 2} {language === "en" ? (room.capacite > 1 ? "guests" : "guest") : (room.capacite > 1 ? "personnes" : "personne")}</span>
                      </div>

                      {room.description && (
                        <p style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.88rem",
                          margin: 0,
                          lineHeight: 1.45,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          {room.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Prix et Bouton Réserver (Action essentielle) */}
                  <div style={{
                    padding: "0 22px 22px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--border)"
                  }}>
                    <div>
                      <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--terracotta)" }}>
                        {room.prixParNuit} MAD
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>
                        / {language === "en" ? "night" : "nuit"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenRoomBooking(room)}
                      className="btn btn-primary"
                      style={{
                        padding: "11px 22px",
                        fontSize: "0.92rem",
                        fontWeight: 700,
                        borderRadius: "12px",
                        cursor: "pointer"
                      }}
                    >
                      {language === "en" ? "Book Room" : "Réserver cette chambre"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODALE DE RÉSERVATION AVEC FORMULAIRE */}
      {showBookingModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2000,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            maxWidth: "580px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            position: "relative"
          }}>
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setShowBookingModal(false)}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                color: "#64748b",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
            >
              ✕
            </button>

            {bookingSuccessData ? (
              /* ÉCRAN DE CONFIRMATION SUCCÈS ÉPURÉ */
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  margin: "0 auto 16px auto",
                  border: "2px solid #a7f3d0"
                }}>
                  ✓
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", color: "var(--text-primary)", marginBottom: "6px" }}>
                  {language === "en" ? "Reservation Confirmed" : "Réservation Enregistrée"}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
                  {language === "en"
                    ? `Thank you ${guestPrenom} ${guestNom}. Your booking details have been recorded.`
                    : `Merci ${guestPrenom} ${guestNom}. Votre réservation a bien été enregistrée.`}
                </p>

                <div style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  padding: "16px 18px",
                  textAlign: "left",
                  marginBottom: "20px",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                  border: "1px solid #e2e8f0"
                }}>
                  <p style={{ margin: "0 0 6px 0" }}><strong>Riad :</strong> {riad.nom} ({riad.ville})</p>
                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>{language === "en" ? "Accommodation" : "Hébergement"} :</strong> {bookingSuccessData.roomName}
                  </p>
                  <p style={{ margin: "0 0 6px 0" }}><strong>Dates :</strong> {bookingSuccessData.dateDebutFormatted} → {bookingSuccessData.dateFinFormatted} ({bookingSuccessData.nights} {bookingSuccessData.nights > 1 ? "nuits" : "nuit"})</p>
                  <p style={{ margin: "0 0 6px 0" }}><strong>Total :</strong> <span style={{ color: "var(--terracotta)", fontWeight: 700 }}>{bookingSuccessData.total} MAD</span></p>
                  <p style={{ margin: "0 0 6px 0" }}><strong>Email :</strong> {guestEmail}</p>
                  <p style={{ margin: 0 }}><strong>Téléphone :</strong> {guestPhone}</p>
                </div>

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={handleCloseSuccessAndShowRooms}
                    className="btn btn-primary"
                    style={{ padding: "11px 26px", fontSize: "0.92rem", fontWeight: 700, borderRadius: "10px" }}
                  >
                    {language === "en" ? "Close" : "Fermer"}
                  </button>
                </div>
              </div>
            ) : (
              /* FORMULAIRE DE RÉSERVATION ÉPURÉ */
              <form onSubmit={handleConfirmBooking}>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: "0 0 4px 0"
                }}>
                  {language === "en" ? `Book ${getSelectedRoomName()}` : `Réserver ${getSelectedRoomName()}`}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 18px 0" }}>
                  {riad.nom} · {riad.ville}
                </p>

                {bookingError && (
                  <div style={{
                    backgroundColor: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    marginBottom: "16px"
                  }}>
                    {bookingError}
                  </div>
                )}

                {/* Calendrier épuré */}
                <div style={{ marginBottom: "18px" }}>
                  <AvailabilityCalendar
                    planningDates={planningDates}
                    selectedRoomId={selectedRoom?.id || null}
                    isRiadEntier={isRiadEntierBooking}
                    startDate={dateDebut}
                    endDate={dateFin}
                    onSelectDates={({ dateDebut: d1, dateFin: d2 }) => {
                      setDateDebut(d1);
                      setDateFin(d2);
                      setBookingError("");
                    }}
                    interactive={true}
                    language={language}
                  />
                </div>

                {/* Dates d'arrivée et départ */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "5px" }}>
                      {language === "en" ? "Check-in" : "Date d'arrivée"} *
                    </label>
                    <input
                      type="date"
                      value={dateDebut}
                      min={todayStr}
                      onChange={(e) => setDateDebut(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        fontSize: "0.88rem",
                        color: "var(--text-primary)",
                        backgroundColor: "#f8fafc"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "5px" }}>
                      {language === "en" ? "Check-out" : "Date de départ"} *
                    </label>
                    <input
                      type="date"
                      value={dateFin}
                      min={dateDebut || todayStr}
                      onChange={(e) => setDateFin(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        fontSize: "0.88rem",
                        color: "var(--text-primary)",
                        backgroundColor: "#f8fafc"
                      }}
                    />
                  </div>
                </div>

                {/* Coordonnées Client */}
                <div style={{
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                  marginBottom: "16px",
                  border: "1px solid var(--border)"
                }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {language === "en" ? "Guest Information" : "Coordonnées du client"}
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "3px" }}>
                        {language === "en" ? "Last Name" : "Nom"} *
                      </label>
                      <input
                        type="text"
                        placeholder="Benali"
                        value={guestNom}
                        onChange={(e) => setGuestNom(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          fontSize: "0.85rem",
                          backgroundColor: "#fff"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "3px" }}>
                        {language === "en" ? "First Name" : "Prénom"} *
                      </label>
                      <input
                        type="text"
                        placeholder="Karim"
                        value={guestPrenom}
                        onChange={(e) => setGuestPrenom(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          fontSize: "0.85rem",
                          backgroundColor: "#fff"
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "3px" }}>
                        {language === "en" ? "Email" : "Email"} *
                      </label>
                      <input
                        type="email"
                        placeholder="contact@exemple.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          fontSize: "0.85rem",
                          backgroundColor: "#fff"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "3px" }}>
                        {language === "en" ? "Phone" : "Téléphone"} *
                      </label>
                      <input
                        type="tel"
                        placeholder="+212 600-000000"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          fontSize: "0.85rem",
                          backgroundColor: "#fff"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mode de paiement épuré */}
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    {language === "en" ? "Payment Method" : "Mode de paiement"}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setMethodePaiement("SUR_PLACE")}
                      style={{
                        padding: "9px 6px",
                        borderRadius: "8px",
                        border: methodePaiement === "SUR_PLACE" ? "2px solid var(--terracotta)" : "1px solid var(--border)",
                        backgroundColor: methodePaiement === "SUR_PLACE" ? "rgba(217, 107, 67, 0.08)" : "#fff",
                        color: methodePaiement === "SUR_PLACE" ? "var(--terracotta)" : "var(--text-primary)",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Paiement sur place
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethodePaiement("CARTE_BANCAIRE")}
                      style={{
                        padding: "9px 6px",
                        borderRadius: "8px",
                        border: methodePaiement === "CARTE_BANCAIRE" ? "2px solid var(--terracotta)" : "1px solid var(--border)",
                        backgroundColor: methodePaiement === "CARTE_BANCAIRE" ? "rgba(217, 107, 67, 0.08)" : "#fff",
                        color: methodePaiement === "CARTE_BANCAIRE" ? "var(--terracotta)" : "var(--text-primary)",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Carte bancaire
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethodePaiement("PAYPAL")}
                      style={{
                        padding: "9px 6px",
                        borderRadius: "8px",
                        border: methodePaiement === "PAYPAL" ? "2px solid var(--terracotta)" : "1px solid var(--border)",
                        backgroundColor: methodePaiement === "PAYPAL" ? "rgba(217, 107, 67, 0.08)" : "#fff",
                        color: methodePaiement === "PAYPAL" ? "var(--terracotta)" : "var(--text-primary)",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      PayPal
                    </button>
                  </div>
                </div>

                {/* Champs Carte Bancaire (si sélectionné) */}
                {methodePaiement === "CARTE_BANCAIRE" && (
                  <div style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid var(--border)",
                    marginBottom: "16px"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "3px" }}>
                        Numéro de carte
                      </label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• ••••"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          fontSize: "0.85rem",
                          backgroundColor: "#fff"
                        }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "3px" }}>
                          Titulaire
                        </label>
                        <input
                          type="text"
                          placeholder="Nom Prénom"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "7px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            fontSize: "0.85rem",
                            backgroundColor: "#fff"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "3px" }}>
                          MM/AA
                        </label>
                        <input
                          type="text"
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "7px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            fontSize: "0.85rem",
                            backgroundColor: "#fff"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "3px" }}>
                          CVC
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "7px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            fontSize: "0.85rem",
                            backgroundColor: "#fff"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Récapitulatif Prix & Bouton Confirmation */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border)"
                }}>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block" }}>
                      {calculateNights()} {calculateNights() > 1 ? "nuits" : "nuit"} · Total
                    </span>
                    <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--terracotta)" }}>
                      {calculateTotalPrice()} MAD
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ padding: "11px 24px", fontSize: "0.92rem", fontWeight: 700, borderRadius: "10px" }}
                  >
                    {submitting
                      ? (language === "en" ? "Booking..." : "Réservation en cours...")
                      : (language === "en" ? "Confirm Reservation" : "Confirmer la réservation")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
