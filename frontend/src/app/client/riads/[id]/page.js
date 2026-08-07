"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mapPhotoUrl, API_BASE } from "../../../../lib/api.js";
import { useLanguage } from "../../../../lib/LanguageContext";
import { addNotification } from "../../../../lib/NotificationSystem";

export default function RiadDetailPage({ params }) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const resolvedParams = use(params);
  const riadId = resolvedParams.id;

  const [currentUser, setCurrentUser] = useState(null);
  const [riad, setRiad] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [clientReservations, setClientReservations] = useState([]);
  const [chambrePhotosMap, setChambrePhotosMap] = useState({}); // { chambreId: [photos] }

  // États de filtrage des chambres
  const [selectedType, setSelectedType] = useState("Tous");

  // États de la modale de réservation active
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isRiadEntierBooking, setIsRiadEntierBooking] = useState(false);

  // Formulaire de réservation dans la modale
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [methodePaiement, setMethodePaiement] = useState("CARTE_BANCAIRE");

  // Formulaire de paiement par Carte Bancaire
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isPayingCard, setIsPayingCard] = useState(false);

  // États UI
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // État du simulateur PayPal
  const [showPayPalSimulator, setShowPayPalSimulator] = useState(false);
  const [payPalStep, setPayPalStep] = useState(1); // 1: Login/Pay, 2: Loading, 3: Success

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    loadData(user.id);
  }, [riadId]);

  // Vider le message de succès après 5 secondes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadData = async (userId = currentUser?.id) => {
    if (!userId) return;
    setLoading(true);
    try {
      const [riadRes, roomsRes, avisRes, resClientRes] = await Promise.all([
        fetch(`${API_BASE}/api/riads/${riadId}`),
        fetch(`${API_BASE}/api/riads/${riadId}/chambres`),
        fetch(`${API_BASE}/api/riads/${riadId}/avis`),
        fetch(`${API_BASE}/api/reservations/client`, {
          headers: { "X-User-Id": userId }
        })
      ]);

      if (!riadRes.ok) throw new Error(t("riad_not_found"));
      const riadData = await riadRes.json();
      setRiad(riadData);

      if (roomsRes.ok) {
        const cData = await roomsRes.json();
        setRooms(cData);
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

      if (avisRes.ok) {
        setReviews(await avisRes.json());
      }

      if (resClientRes.ok) {
        const resData = await resClientRes.json();
        // Filtrer les réservations pour ce Riad
        const filtered = resData.filter(r => r.riad?.id === riadId);
        setClientReservations(filtered);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si le riad entier est réservé par le client
  const isRiadEntierReserved = useMemo(() => {
    return clientReservations.some(res =>
      (res.statut === "EN_ATTENTE" || res.statut === "CONFIRMEE") && res.riadEntier
    );
  }, [clientReservations]);

  // Vérifier si une chambre ou plus est réservée ou en attente
  const hasAnyRoomReserved = useMemo(() => {
    return rooms.some((ch) =>
      clientReservations.some(res =>
        (res.statut === "EN_ATTENTE" || res.statut === "CONFIRMEE") &&
        (!res.riadEntier && res.chambres?.some(room => room.id === ch.id))
      )
    );
  }, [rooms, clientReservations]);

  // Types de chambres disponibles pour le filtre
  const roomTypes = useMemo(() => {
    const types = new Set(rooms.map((ch) => ch.typeChambre).filter(Boolean));
    return ["Tous", ...Array.from(types)];
  }, [rooms]);

  // Chambres filtrées (uniquement disponibles)
  const filteredRooms = useMemo(() => {
    if (isRiadEntierReserved) {
      return []; // Si le riad entier est privatisé, aucune chambre individuelle n'est disponible
    }
    return rooms.filter((ch) => {
      // 1. Indisponible par l'hôte
      if (ch.disponible === false) {
        return false;
      }
      
      // 2. Déjà réservée ou en attente par le client
      const activeRes = clientReservations.find(res =>
        (res.statut === "EN_ATTENTE" || res.statut === "CONFIRMEE") &&
        (!res.riadEntier && res.chambres?.some(room => room.id === ch.id))
      );
      if (activeRes) {
        return false;
      }

      // 3. Filtre par type
      if (selectedType !== "Tous" && ch.typeChambre !== selectedType) {
        return false;
      }
      return true;
    });
  }, [rooms, clientReservations, isRiadEntierReserved, selectedType]);

  // Calcul des nuits
  const nights = useMemo(() => {
    if (!dateDebut || !dateFin) return 0;
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    const diffTime = end - start;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [dateDebut, dateFin]);

  // Calcul du prix total
  const totalPrice = useMemo(() => {
    if (nights <= 0) return 0;
    if (isRiadEntierBooking) {
      return nights * (riad?.prixRiadEntier || 0);
    } else if (selectedRoom) {
      return nights * selectedRoom.prixParNuit;
    }
    return 0;
  }, [nights, isRiadEntierBooking, selectedRoom, riad]);

  // Moyenne des avis
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.note, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const openBookingModal = (room = null, riadEntierFlag = false) => {
    setSelectedRoom(room);
    setIsRiadEntierBooking(riadEntierFlag);
    setDateDebut("");
    setDateFin("");
    setMethodePaiement("CARTE_BANCAIRE");
    setShowCardForm(false);
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setShowBookingModal(true);
    setError("");
    setSuccess("");
  };

  const handleBookingSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!dateDebut || !dateFin) {
      setError(t("err_fill_dates"));
      return;
    }
    if (nights <= 0) {
      setError(t("err_date_order"));
      return;
    }

    if (methodePaiement === "PAYPAL") {
      setPayPalStep(1);
      setShowPayPalSimulator(true);
    } else if (methodePaiement === "CARTE_BANCAIRE") {
      setShowCardForm(true);
    } else {
      await createReservation();
    }
  };

  const createReservation = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        riadId: riad.id,
        dateDebut,
        dateFin,
        riadEntier: isRiadEntierBooking,
        chambreIds: isRiadEntierBooking ? [] : [selectedRoom.id],
        methodePaiement,
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
      if (!res.ok) throw new Error(data.message || "Erreur lors de la réservation.");

      setSuccess(payload.methodePaiement === "SUR_PLACE" 
        ? t("success_booking_pending")
        : t("success_booking_confirmed")
      );
      setShowBookingModal(false);

      // ── SIMULATION DES NOTIFICATIONS ───────────────────────────────────────
      // 1. Notification dans la cloche locale
      addNotification(
        language === "en"
          ? `Your booking at ${riad.nom} from ${dateDebut} to ${dateFin} is confirmed!`
          : `Votre réservation pour le Riad ${riad.nom} du ${dateDebut} au ${dateFin} est confirmée !`,
        "success"
      );

      // 2. Simulation SMS
      window.dispatchEvent(new CustomEvent("simulated_notification", {
        detail: {
          type: "sms",
          sender: "MoroccoRiads",
          phone: currentUser.telephone || "+212 661-234567",
          message: language === "en"
            ? `MoroccoRiads: Your booking for ${riad.nom} (${dateDebut} to ${dateFin}) is CONFIRMED! Enjoy your trip.`
            : `MoroccoRiads : Votre réservation pour le ${riad.nom} (${dateDebut} au ${dateFin}) est CONFIRMÉE ! Bon voyage.`
        }
      }));

      // 3. Simulation Email
      window.dispatchEvent(new CustomEvent("simulated_notification", {
        detail: {
          type: "email",
          sender: "booking@moroccoriads.com",
          email: currentUser.email,
          subject: language === "en" ? "Booking Confirmation - MoroccoRiads" : "Confirmation de Réservation - MoroccoRiads",
          message: language === "en"
            ? `Hello ${currentUser.prenom} ${currentUser.nom},\n\nWe are pleased to confirm your booking for Riad: ${riad.nom}.\nDates: ${dateDebut} to ${dateFin}.\nTotal Price: ${totalPrice} MAD.\n\nMoroccan hospitality is waiting for you!\n\nBest regards,\nThe MoroccoRiads Team`
            : `Bonjour ${currentUser.prenom} ${currentUser.nom},\n\nNous avons le plaisir de vous confirmer votre réservation au Riad : ${riad.nom}.\nDates : du ${dateDebut} au ${dateFin}.\nMontant total : ${totalPrice} MAD.\n\nL'hospitalité marocaine vous attend au cœur de la médina !\n\nCordialement,\nL'équipe MoroccoRiads`
        }
      }));

      // 4. Déclencher un rappel avant séjour après 4 secondes pour la démo
      setTimeout(() => {
        addNotification(
          language === "en"
            ? `Reminder: Your stay at Riad ${riad.nom} starts tomorrow!`
            : `Rappel : Votre séjour au Riad ${riad.nom} commence demain !`,
          "reminder"
        );

        window.dispatchEvent(new CustomEvent("simulated_notification", {
          detail: {
            type: "sms",
            sender: "MoroccoRiads",
            phone: currentUser.telephone || "+212 661-234567",
            message: language === "en"
              ? `Reminder: Your stay at Riad ${riad.nom} starts tomorrow. We are excited to welcome you!`
              : `Rappel : Votre séjour au Riad ${riad.nom} commence demain. Nous avons hâte de vous accueillir !`
          }
        }));

        window.dispatchEvent(new CustomEvent("simulated_notification", {
          detail: {
            type: "email",
            sender: "concierge@moroccoriads.com",
            email: currentUser.email,
            subject: language === "en" ? "Stay Reminder - MoroccoRiads" : "Rappel de Séjour - MoroccoRiads",
            message: language === "en"
              ? `Hello ${currentUser.prenom},\n\nThis is a friendly reminder that your stay at Riad ${riad.nom} starts tomorrow.\nYour check-in details and assistance are available in your client dashboard.\n\nSafe travels,\nMoroccoRiads Concierge`
              : `Bonjour ${currentUser.prenom},\n\nNous vous rappelons que votre séjour au Riad ${riad.nom} commence demain.\nLes détails de votre accueil et l'assistance en direct sont disponibles dans votre espace client.\n\nBon voyage,\nLe Concierge MoroccoRiads`
          }
        }));

        // Déclencher l'envoi du vrai mail de rappel de séjour via le backend
        fetch(`${API_BASE}/api/reservations/rappel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nomClient: `${currentUser.prenom} ${currentUser.nom}`,
            emailClient: currentUser.email,
            nomRiad: riad.nom,
          }),
        }).catch((err) => console.error("Erreur d'envoi du mail de rappel réel:", err));
      }, 4000);

      // Recharger les données pour rafraîchir l'état des chambres
      await loadData(currentUser.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };


  const handlePayPalPaymentSuccess = async () => {
    setPayPalStep(2);
    setTimeout(() => {
      setPayPalStep(3);
      setTimeout(async () => {
        setShowPayPalSimulator(false);
        await createReservation();
      }, 1500);
    }, 3000);
  };

  const renderStars = (note) => {
    const n = Math.round(note);
    return "★".repeat(n) + "☆".repeat(5 - n);
  };

  if (loading && !riad) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error && !riad) {
    return (
      <div style={{ maxWidth: "800px", margin: "60px auto", padding: "20px", textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontSize: "1.2rem" }}>⚠️ {error}</p>
        <Link href="/client/catalogue" className="btn btn-primary" style={{ marginTop: "20px", display: "inline-block" }}>
          {t("back_to_catalogue")}
        </Link>
      </div>
    );
  }

  const isPrivatisationDisabled = isRiadEntierReserved || hasAnyRoomReserved;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
      
      {/* Bouton Retour Premium & Discret */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={() => router.push("/client/catalogue")}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "#ffffff",
            color: "var(--text-secondary)",
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "var(--shadow-sm)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.borderColor = "var(--text-secondary)";
            e.currentTarget.style.transform = "translateX(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.transform = "translateX(0)";
          }}
          title={t("back_to_catalogue")}
        >
          ←
        </button>
      </div>

      {/* Notifications */}
      {error && !showBookingModal && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#ef4444", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}
      {success && !showBookingModal && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "14px 20px", color: "#10b981", marginBottom: "20px" }}>
          ✅ {success}
        </div>
      )}

      {/* Header Riad */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "2.4rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            {riad.nom}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>
            📍 {riad.adresse}, {riad.ville}
          </p>
          {/* Services Riad */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
            {riad.hasSpa && (
              <span style={{ fontSize: "0.82rem", padding: "4px 12px", borderRadius: "20px", backgroundColor: "#f3e8ff", color: "#7c3aed", fontWeight: 600 }}>
                {t("service_spa")}
              </span>
            )}
            {riad.hasHammam && (
              <span style={{ fontSize: "0.82rem", padding: "4px 12px", borderRadius: "20px", backgroundColor: "#e0f2fe", color: "#0284c7", fontWeight: 600 }}>
                {t("service_hammam")}
              </span>
            )}
            {riad.hasTraiteur && (
              <span style={{ fontSize: "0.82rem", padding: "4px 12px", borderRadius: "20px", backgroundColor: "#fef3c7", color: "#d97706", fontWeight: 600 }}>
                {t("service_catering")}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {reviews.length > 0 && (
            <div style={{ textAlign: "right" }}>
              <span style={{ color: "#f59e0b", fontSize: "1.2rem", fontWeight: 700 }}>
                ★ {avgRating}
              </span>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>({reviews.length} {t("reviews_label")})</p>
            </div>
          )}
          {riad.prixRiadEntier && (
            <button
              onClick={() => openBookingModal(null, true)}
              disabled={isPrivatisationDisabled}
              className="btn btn-secondary"
              style={{
                padding: "12px 20px",
                borderColor: isPrivatisationDisabled ? "#cbd5e0" : "var(--terracotta)",
                color: isPrivatisationDisabled ? "#a0aec0" : "var(--terracotta)",
                background: isPrivatisationDisabled ? "#f7fafc" : "transparent",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: isPrivatisationDisabled ? "not-allowed" : "pointer"
              }}
            >
              {isRiadEntierReserved 
                ? `${t("entire_riad_reserved")}` 
                : hasAnyRoomReserved 
                ? `${t("privatization_unavailable")}` 
                : `🏰 ${t("privatize_entire_riad")} (${riad.prixRiadEntier} MAD)`}
            </button>
          )}
        </div>
      </div>

      {/* Liste des Chambres (Pleine Largeur) */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", margin: 0, color: "var(--text-primary)" }}>
            {t("available_rooms")}
          </h2>

          {/* Barre de Filtres des Chambres */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>

            {/* Sélecteur de Type de Chambre */}
            {roomTypes.length > 2 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>{t("filter_type_label")}</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontSize: "0.85rem",
                    outline: "none",
                    cursor: "pointer",
                    backgroundColor: "#fff"
                  }}
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "Tous" ? t("filter_all_types") : type}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        
        {filteredRooms.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", padding: "20px 0" }}>{t("no_rooms_available")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredRooms.map((ch) => {
              const chPhotos = chambrePhotosMap[ch.id] || [];
              const chPhotoUrl = chPhotos.length > 0 ? mapPhotoUrl(chPhotos[0].url) : null;

              // Vérifier le statut de réservation de cette chambre par le client
              const activeRes = clientReservations.find(res =>
                (res.statut === "EN_ATTENTE" || res.statut === "CONFIRMEE") &&
                (res.riadEntier || res.chambres?.some(room => room.id === ch.id))
              );

              const isHostUnavailable = ch.disponible === false;
              const isReserved = activeRes?.statut === "CONFIRMEE" || isRiadEntierReserved;
              const isPending = activeRes?.statut === "EN_ATTENTE";

              return (
                <div
                  key={ch.id}
                  style={{
                    display: "flex",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "var(--shadow-sm)",
                    opacity: isHostUnavailable ? 0.75 : 1,
                    transition: "transform 0.2s"
                  }}
                  onMouseEnter={(e) => { if (!isReserved && !isPending && !isHostUnavailable) e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { if (!isReserved && !isPending && !isHostUnavailable) e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {chPhotoUrl ? (
                    <div style={{ width: "220px", background: `url(${chPhotoUrl}) center/cover no-repeat`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: "220px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", fontSize: "2.5rem", flexShrink: 0 }}>🛏️</div>
                  )}
                  
                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{ch.nomChambre}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {isHostUnavailable ? (
                            <span style={{ fontSize: "0.78rem", background: "rgba(100,116,139,0.12)", color: "#64748b", padding: "4px 12px", borderRadius: "20px", fontWeight: 600 }}>
                              🚫 {t("room_unavailable_badge")}
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.78rem", background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "4px 12px", borderRadius: "20px", fontWeight: 600 }}>
                              ✅ {t("room_available_badge")}
                            </span>
                          )}

                          {isReserved && (
                            <span style={{ fontSize: "0.78rem", background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "4px 12px", borderRadius: "20px", fontWeight: 600 }}>
                              🔒 {t("status_confirmed")}
                            </span>
                          )}
                          {isPending && (
                            <span style={{ fontSize: "0.78rem", background: "rgba(245,158,11,0.1)", color: "#d97706", padding: "4px 12px", borderRadius: "20px", fontWeight: 600 }}>
                              ⏳ {t("status_pending")}
                            </span>
                          )}
                          <span style={{ fontSize: "0.78rem", background: "rgba(15,82,186,0.08)", color: "var(--majorelle)", padding: "4px 12px", borderRadius: "20px", fontWeight: 600 }}>
                            {ch.typeChambre}
                          </span>
                        </div>
                      </div>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: "4px 0" }}>{t("max_capacity")} {ch.capacite} {t("travelers")}</p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", borderTop: "1px solid var(--bg-secondary)", paddingTop: "16px" }}>
                      <strong style={{ color: "var(--terracotta)", fontSize: "1.2rem" }}>
                        {ch.prixParNuit} MAD <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-secondary)" }}>/ {t("per_night")}</span>
                      </strong>
                      
                      {isHostUnavailable ? (
                        <button
                          type="button"
                          disabled
                          className="btn"
                          style={{
                            padding: "10px 24px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            background: "#e2e8f0",
                            color: "#94a3b8",
                            cursor: "not-allowed",
                            border: "none"
                          }}
                        >
                          {t("room_unavailable_badge")}
                        </button>
                      ) : isReserved ? (
                        <button
                          type="button"
                          disabled
                          className="btn"
                          style={{
                            padding: "10px 24px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            background: "#e2e8f0",
                            color: "#a0aec0",
                            cursor: "not-allowed",
                            border: "none"
                          }}
                        >
                          {t("book_this_room")}
                        </button>
                      ) : isPending ? (
                        <button
                          type="button"
                          disabled
                          className="btn"
                          style={{
                            padding: "10px 24px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            background: "#fef3c7",
                            color: "#d97706",
                            cursor: "not-allowed",
                            border: "none"
                          }}
                        >
                          {t("pending_validation")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openBookingModal(ch, false)}
                          className="btn btn-primary"
                          style={{ padding: "10px 24px", fontSize: "0.9rem", fontWeight: 600 }}
                        >
                          {t("book_this_room")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Témoignages */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "32px", marginBottom: "40px" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", marginBottom: "24px", color: "var(--text-primary)" }}>
          {t("traveler_reviews")}
        </h2>
        {reviews.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>{t("no_reviews_yet")}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {reviews.map((r) => {
              const initials = `${r.client?.prenom?.[0] || ""}${r.client?.nom?.[0] || ""}`.toUpperCase();
              const dateFormatted = r.dateCreation
                ? new Date(r.dateCreation).toLocaleDateString(language === "en" ? "en-US" : "fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })
                : "";

              return (
                <div
                  key={r.id}
                  className="card"
                  style={{
                    padding: "24px",
                    borderRadius: "16px",
                    background: "#ffffff",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    {/* User Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          background: "var(--terracotta)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.95rem"
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-primary)", display: "block", fontSize: "0.95rem" }}>
                          {r.client?.prenom} {r.client?.nom}
                        </strong>
                        {dateFormatted && (
                          <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                            {dateFormatted}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Note en étoiles */}
                    <div style={{ color: "#f59e0b", fontSize: "0.9rem", marginBottom: "12px" }}>
                      {renderStars(r.note)}
                    </div>

                    {/* Commentaire */}
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
                      "{r.commentaire}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modale de Réservation Épurée (Apparaît après clic) ───────────────── */}
      {showBookingModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", padding: "32px", borderRadius: "16px", backgroundColor: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                🛎️ {isRiadEntierBooking ? t("privatize_entire_riad") : `${t("book_this_room")} - ${selectedRoom?.nomChambre}`}
              </h2>
              <button onClick={() => setShowBookingModal(false)} style={{ background: "none", border: "none", fontSize: "1.8rem", cursor: "pointer", color: "var(--text-secondary)" }}>×</button>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 16px", color: "#ef4444", marginBottom: "16px", fontSize: "0.88rem" }}>
                ⚠️ {error}
              </div>
            )}

            {!showCardForm ? (
              <form onSubmit={handleBookingSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>{t("check_in_date")}</label>
                  <input
                    type="date"
                    className="form-input-control"
                    min={new Date().toISOString().split("T")[0]}
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>{t("check_out_date")}</label>
                  <input
                    type="date"
                    className="form-input-control"
                    min={dateDebut || new Date().toISOString().split("T")[0]}
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "8px" }}>{t("payment_method")}</label>
                  <select
                    className="form-input-control"
                    value={methodePaiement}
                    onChange={(e) => setMethodePaiement(e.target.value)}
                  >
                    <option value="CARTE_BANCAIRE">{t("credit_card")}</option>
                    <option value="PAYPAL">{t("paypal_secure")}</option>
                    <option value="SUR_PLACE">{t("on_site_cash")}</option>
                  </select>
                </div>

                {/* Résumé du coût dynamique */}
                {nights > 0 && (
                  <div style={{ background: "var(--sand)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                      <span>{t("nights_label")}</span>
                      <strong>{nights} {t("nights_label").toLowerCase()}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                      <span>{t("unit_price")}</span>
                      <strong>{isRiadEntierBooking ? riad.prixRiadEntier : selectedRoom?.prixParNuit} MAD / {t("per_night")}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "8px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t("total").replace(" :", "").replace(":", "")}</span>
                      <strong style={{ color: "var(--terracotta)", fontSize: "1.15rem" }}>{totalPrice} MAD</strong>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px", fontWeight: 600, fontSize: "0.95rem" }}
                  disabled={actionLoading}
                >
                  {actionLoading ? t("creating_booking") : t("confirm_and_book")}
                </button>
              </form>
            ) : (
              <div>
                {/* Visual Credit Card Preview */}
                <div style={{
                  background: "linear-gradient(135deg, #1e293b, #0f172a)",
                  borderRadius: "12px",
                  padding: "20px",
                  color: "#ffffff",
                  fontFamily: "monospace",
                  position: "relative",
                  marginBottom: "24px",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "170px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "1.1rem", fontStyle: "italic", fontWeight: 700 }}>MoroccoRiads</span>
                    <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>💳 SECURE CARD</span>
                  </div>
                  
                  <div style={{ fontSize: "1.2rem", letterSpacing: "2px", margin: "20px 0 10px 0" }}>
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "0.6rem", opacity: 0.5, textTransform: "uppercase" }}>Card Holder</div>
                      <div style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>{cardName || "NAME SURNAME"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.6rem", opacity: 0.5, textTransform: "uppercase" }}>Expires</div>
                      <div style={{ fontSize: "0.85rem" }}>{cardExpiry || "MM/YY"}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>Nom sur la carte</label>
                  <input
                    type="text"
                    className="form-input-control"
                    placeholder="M. AHMAD"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>Numéro de carte</label>
                  <input
                    type="text"
                    className="form-input-control"
                    placeholder="1234 5678 1234 5678"
                    maxLength="19"
                    value={cardNumber}
                    onChange={(e) => {
                      // format automatique des espaces toutes les 4 lettres
                      const val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                      setCardNumber(val);
                    }}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>Expiration</label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="MM/YY"
                      maxLength="5"
                      value={cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val.length === 2 && !val.includes("/")) {
                          val += "/";
                        }
                        setCardExpiry(val);
                      }}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>CVV</label>
                    <input
                      type="password"
                      className="form-input-control"
                      placeholder="•••"
                      maxLength="3"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCardForm(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: "12px" }}
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
                        setError("Veuillez remplir tous les champs de la carte.");
                        return;
                      }
                      setIsPayingCard(true);
                      setTimeout(async () => {
                        setIsPayingCard(false);
                        setShowCardForm(false);
                        await createReservation();
                      }, 2000);
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: "12px" }}
                    disabled={isPayingCard}
                  >
                    {isPayingCard ? "Validation..." : `Payer ${totalPrice} MAD`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Simulateur PayPal Professionnel (High-Fidelity) ────────────────── */}
      {showPayPalSimulator && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "450px", background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            
            <div style={{ background: "#003087", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.4rem", fontStyle: "italic", fontFamily: "sans-serif" }}>
                Pay<span style={{ color: "#0079C1" }}>Pal</span>
              </span>
              <span style={{ color: "#fff", fontSize: "0.85rem", opacity: 0.8 }}>{t("secure_connection")}</span>
            </div>

            {payPalStep === 1 && (
              <div style={{ padding: "30px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", color: "#718096" }}>{t("merchant")}</span>
                    <strong style={{ display: "block", color: "#1a202c" }}>MoroccoRiads Inc.</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.85rem", color: "#718096" }}>{t("amount")}</span>
                    <strong style={{ display: "block", color: "#1a202c", fontSize: "1.1rem" }}>{totalPrice} MAD</strong>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "0.85rem", color: "#4a5568", fontWeight: 600, display: "block", marginBottom: "6px" }}>{t("paypal_email")}</label>
                  <input
                    type="email"
                    className="form-input-control"
                    defaultValue={currentUser?.email}
                    style={{ borderColor: "#cbd5e0" }}
                    disabled
                  />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "0.85rem", color: "#4a5568", fontWeight: 600, display: "block", marginBottom: "6px" }}>{t("login_password")}</label>
                  <input
                    type="password"
                    className="form-input-control"
                    defaultValue="••••••••"
                    style={{ borderColor: "#cbd5e0" }}
                    disabled
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePayPalPaymentSuccess}
                  style={{
                    width: "100%",
                    background: "#ffc439",
                    border: "none",
                    borderRadius: "24px",
                    padding: "12px",
                    fontWeight: 700,
                    color: "#000",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    marginBottom: "12px"
                  }}
                >
                  {t("pay")} {totalPrice} MAD
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowPayPalSimulator(false)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px solid #cbd5e0",
                    borderRadius: "24px",
                    padding: "12px",
                    fontWeight: 600,
                    color: "#4a5568",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  {t("cancel_and_return")}
                </button>
              </div>
            )}

            {payPalStep === 2 && (
              <div style={{ padding: "50px 24px", textAlign: "center" }}>
                <div className="spinner" style={{ margin: "0 auto 24px auto", borderColor: "#003087", borderTopColor: "transparent" }} />
                <h4 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1a202c", marginBottom: "8px" }}>
                  {t("processing_payment")}
                </h4>
                <p style={{ color: "#718096", fontSize: "0.88rem", margin: 0 }}>
                  {t("dont_close_window")}
                </p>
              </div>
            )}

            {payPalStep === 3 && (
              <div style={{ padding: "50px 24px", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", background: "#e6fffa", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px auto" }}>
                  <span style={{ fontSize: "2rem", color: "#319795" }}>✓</span>
                </div>
                <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#2d3748", marginBottom: "8px" }}>
                  {t("payment_authorized")}
                </h4>
                <p style={{ color: "#718096", fontSize: "0.88rem", margin: 0 }}>
                  {t("paypal_tx_id")} PAY-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
                <p style={{ color: "#4a5568", fontSize: "0.85rem", marginTop: "12px", fontWeight: 500 }}>
                  {t("auto_redirect")}
                </p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

