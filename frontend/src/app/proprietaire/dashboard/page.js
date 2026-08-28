"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

function ProprietaireDashboardInner() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const activeTab = searchParams ? searchParams.get("tab") || "dashboard" : "dashboard";

  const [user, setUser] = useState(null);
  const [riads, setRiads] = useState([]);
  const [selectedRiadId, setSelectedRiadId] = useState("");
  const [chambres, setChambres] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [planningDates, setPlanningDates] = useState([]);
  const [selectedPlanningRoomId, setSelectedPlanningRoomId] = useState("ALL");
  const [alertes, setAlertes] = useState({ arriveesAujourdhui: [], nouvellesReservations: [], stats: {} });
  const [toastMessage, setToastMessage] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("Toutes");
  const [reservationFilter, setReservationFilter] = useState("TOUTES");

  // Modale Réservation Directe (Walk-in / Téléphone)
  const [showDirectBookingModal, setShowDirectBookingModal] = useState(false);
  const [isSubmittingDirectBooking, setIsSubmittingDirectBooking] = useState(false);
  const [directBookingForm, setDirectBookingForm] = useState({
    riadId: "",
    chambreId: "",
    riadEntier: false,
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    dateDebut: new Date().toISOString().split("T")[0],
    dateFin: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    methodePaiement: "SUR_PLACE"
  });

  // Modale de Check-in Client à l'arrivée
  const [checkInReservation, setCheckInReservation] = useState(null);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    typePieceIdentite: "CIN",
    numeroPieceIdentite: "",
    nationalite: "Marocaine",
    dateNaissance: "",
    nombrePersonnes: 2,
    remarques: "",
    paiementEffectueSurPlace: true,
    methodePaiementSurPlace: "ESPECES"
  });

  // Modale de Consultation / Impression Fiche Check-in (Police)
  const [viewingCheckInVoucher, setViewingCheckInVoucher] = useState(null);

  // Modale de suppression chambre
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Formulaire Nouveau Riad
  const [newRiadForm, setNewRiadForm] = useState({
    nom: "",
    ville: "Marrakech",
    adresse: "",
    description: "",
    prixRiadEntier: 2000,
    hasSpa: true,
    hasHammam: true,
    hasTraiteur: true,
    photoUrl: "https://res.cloudinary.com/mgmnml6e/image/upload/v1783959393/j5jlng36f4zyt1vswgou.jpg"
  });
  const [selectedRiadFile, setSelectedRiadFile] = useState(null);
  const [riadFilePreview, setRiadFilePreview] = useState("");

  // Modif photo Riad
  const [editRiadFile, setEditRiadFile] = useState(null);
  const [editRiadFilePreview, setEditRiadFilePreview] = useState("");

  // Formulaire Paramètres Profil
  const [profileForm, setProfileForm] = useState({
    nom: "El Amrani",
    prenom: "Houda",
    email: "elamranihouda540@gmail.com",
    telephone: "+212 600-000000",
    motDePasse: "",
    confirmPassword: ""
  });

  // Details & Services du Riad sélectionné
  const [services, setServices] = useState({
    nom: "",
    adresse: "",
    description: "",
    prixRiadEntier: 0,
    hasSpa: false,
    hasHammam: false,
    hasTraiteur: false,
    photoUrl: ""
  });

  // Modale Ajout Chambre
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    nomChambre: "",
    typeChambre: "DOUBLE",
    prixParNuit: 800,
    capacite: 2,
    description: "",
    photoUrl: "https://res.cloudinary.com/mgmnml6e/image/upload/v1783970648/zw1fdouochvkma354lg3.jpg"
  });
  const [selectedRoomFile, setSelectedRoomFile] = useState(null);
  const [roomFilePreview, setRoomFilePreview] = useState("");

  // Modale Modification Chambre
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingRoomFile, setEditingRoomFile] = useState(null);
  const [editingRoomFilePreview, setEditingRoomFilePreview] = useState("");

  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  const [isSavingRiad, setIsSavingRiad] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setProfileForm({
          nom: u.nom || "El Amrani",
          prenom: u.prenom || "Houda",
          email: u.email || "elamranihouda540@gmail.com",
          telephone: u.telephone || "+212 600-000000",
          motDePasse: "",
          confirmPassword: ""
        });
        loadOwnerData(u.id);
      } catch (e) {}
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadOwnerData = async (ownerId, keepSelectedId = null) => {
    try {
      let dataRiads = [];
      const resRiads = await fetch(`${API_BASE}/api/riads/owner`, {
        headers: { "X-User-Id": ownerId }
      });
      if (resRiads.ok) {
        dataRiads = await resRiads.json();
      }

      let marrakechPublic = [];
      const resMke = await fetch(`${API_BASE}/api/riads/recherche?ville=Marrakech`);
      if (resMke.ok) {
        marrakechPublic = await resMke.json();
      }

      const combined = [...dataRiads, ...marrakechPublic];
      const marrakechOnlyMap = new Map();
      combined.forEach((r) => {
        if (r && r.id && (r.ville === "Marrakech" || r.ville === "marrakech")) {
          marrakechOnlyMap.set(r.id, r);
        }
      });
      const dataRiadsMarrakech = Array.from(marrakechOnlyMap.values());

      if (dataRiadsMarrakech.length > 0) {
        const riadsWithPhotos = await Promise.all(
          dataRiadsMarrakech.map(async (r) => {
            try {
              const pRes = await fetch(`${API_BASE}/api/riads/${r.id}/photos`);
              if (pRes.ok) {
                const pData = await pRes.json();
                if (pData && pData.length > 0) {
                  return { ...r, photoUrl: pData[0].url };
                }
              }
            } catch (e) {}
            return {
              ...r,
              photoUrl: r.photoUrl || "https://res.cloudinary.com/mgmnml6e/image/upload/v1783959393/j5jlng36f4zyt1vswgou.jpg"
            };
          })
        );

        setRiads(riadsWithPhotos);

        if (riadsWithPhotos.length > 0) {
          const activeId = keepSelectedId && riadsWithPhotos.some((r) => r.id === keepSelectedId)
            ? keepSelectedId
            : riadsWithPhotos[0].id;

          const activeRiad = riadsWithPhotos.find((r) => r.id === activeId) || riadsWithPhotos[0];
          setSelectedRiadId(activeRiad.id);
          setServices({
            nom: activeRiad.nom || "",
            adresse: activeRiad.adresse || "",
            description: activeRiad.description || "",
            prixRiadEntier: activeRiad.prixRiadEntier || 0,
            hasSpa: !!activeRiad.hasSpa,
            hasHammam: !!activeRiad.hasHammam,
            hasTraiteur: !!activeRiad.hasTraiteur,
            photoUrl: activeRiad.photoUrl || ""
          });
          setEditRiadFile(null);
          setEditRiadFilePreview("");
          loadChambres(activeRiad.id, ownerId);
          loadPlanningDates(activeRiad.id);
        }
      }

      const resResa = await fetch(`${API_BASE}/api/reservations/owner`, {
        headers: { "X-User-Id": ownerId }
      });
      if (resResa.ok) {
        const dataResa = await resResa.json();
        setReservations(dataResa);
      }

      const resAlertes = await fetch(`${API_BASE}/api/proprietaire/alertes`, {
        headers: { "X-User-Id": ownerId }
      });
      if (resAlertes.ok) {
        const dataAlertes = await resAlertes.json();
        setAlertes(dataAlertes);
      }
    } catch (err) {
      console.error("Erreur chargement données propriétaire :", err);
    }
  };

  const loadPlanningDates = async (riadId) => {
    if (!riadId) return;
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riadId}/planning-dates`);
      if (res.ok) {
        const data = await res.json();
        setPlanningDates(data);
      }
    } catch (e) {
      console.error("Erreur chargement planning :", e);
    }
  };

  const loadChambres = async (riadId, ownerId) => {
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riadId}/chambres`);
      if (res.ok) {
        const data = await res.json();
        const chambresWithPhotos = await Promise.all(
          data.map(async (ch) => {
            try {
              const pRes = await fetch(`${API_BASE}/api/chambres/${ch.id}/photos`);
              if (pRes.ok) {
                const pData = await pRes.json();
                if (pData && pData.length > 0) {
                  return { ...ch, photoUrl: pData[0].url };
                }
              }
            } catch (e) {}
            return {
              ...ch,
              photoUrl: ch.photoUrl || "https://res.cloudinary.com/mgmnml6e/image/upload/v1783970648/zw1fdouochvkma354lg3.jpg"
            };
          })
        );
        setChambres(chambresWithPhotos);
      }
    } catch (err) {
      console.error("Erreur chargement chambres :", err);
    }
  };

  const handleSelectRiad = (riad) => {
    setSelectedRiadId(riad.id);
    setServices({
      nom: riad.nom || "",
      adresse: riad.adresse || "",
      description: riad.description || "",
      prixRiadEntier: riad.prixRiadEntier || 0,
      hasSpa: !!riad.hasSpa,
      hasHammam: !!riad.hasHammam,
      hasTraiteur: !!riad.hasTraiteur,
      photoUrl: riad.photoUrl || ""
    });
    setEditRiadFile(null);
    setEditRiadFilePreview("");
    if (user) {
      loadChambres(riad.id, user.id);
      loadPlanningDates(riad.id);
    }
  };

  const handleCreateRiad = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingRiad(true);

    try {
      let finalPhotoUrl = newRiadForm.photoUrl;

      if (selectedRiadFile) {
        const formData = new FormData();
        formData.append("file", selectedRiadFile);
        formData.append("nom", newRiadForm.nom);

        const uploadRes = await fetch(`${API_BASE}/api/upload/local`, {
          method: "POST",
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            finalPhotoUrl = uploadData.url;
          }
        }
      }

      const res = await fetch(`${API_BASE}/api/riads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify({
          ...newRiadForm,
          photoUrl: finalPhotoUrl
        })
      });

      if (res.ok) {
        const created = await res.json();
        showToast("Riad créé avec succès !");
        setNewRiadForm({
          nom: "",
          ville: "Marrakech",
          adresse: "",
          description: "",
          prixRiadEntier: 2000,
          hasSpa: true,
          hasHammam: true,
          hasTraiteur: true,
          photoUrl: "https://res.cloudinary.com/mgmnml6e/image/upload/v1783959393/j5jlng36f4zyt1vswgou.jpg"
        });
        setSelectedRiadFile(null);
        setRiadFilePreview("");
        loadOwnerData(user.id, created.id);
      } else {
        alert("Erreur lors de la création du Riad.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de la création.");
    } finally {
      setIsSavingRiad(false);
    }
  };

  const handleSaveServices = async (e) => {
    e.preventDefault();
    if (!selectedRiadId || !user) return;
    setIsSavingRiad(true);

    try {
      let finalPhotoUrl = services.photoUrl;

      if (editRiadFile) {
        const formData = new FormData();
        formData.append("file", editRiadFile);
        formData.append("nom", services.nom);

        const uploadRes = await fetch(`${API_BASE}/api/upload/local`, {
          method: "POST",
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            finalPhotoUrl = uploadData.url;
          }
        }
      }

      const res = await fetch(`${API_BASE}/api/riads/${selectedRiadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify({
          ...services,
          photoUrl: finalPhotoUrl
        })
      });

      if (res.ok) {
        showToast("Informations du Riad mises à jour !");
        loadOwnerData(user.id, selectedRiadId);
      } else {
        alert("Erreur lors de la mise à jour.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    } finally {
      setIsSavingRiad(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!selectedRiadId || !user) return;
    setIsSubmittingRoom(true);

    try {
      let finalPhotoUrl = newRoomData.photoUrl;

      if (selectedRoomFile) {
        const formData = new FormData();
        formData.append("file", selectedRoomFile);
        formData.append("nom", newRoomData.nomChambre);

        const uploadRes = await fetch(`${API_BASE}/api/upload/local`, {
          method: "POST",
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            finalPhotoUrl = uploadData.url;
          }
        }
      }

      const res = await fetch(`${API_BASE}/api/chambres/riad/${selectedRiadId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify({
          ...newRoomData,
          photoUrl: finalPhotoUrl
        })
      });

      if (res.ok) {
        setShowAddRoomModal(false);
        setNewRoomData({
          nomChambre: "",
          typeChambre: "DOUBLE",
          prixParNuit: 800,
          capacite: 2,
          description: "",
          photoUrl: "https://res.cloudinary.com/mgmnml6e/image/upload/v1783970648/zw1fdouochvkma354lg3.jpg"
        });
        setSelectedRoomFile(null);
        setRoomFilePreview("");
        showToast("Nouvelle chambre ajoutée !");
        loadChambres(selectedRiadId, user.id);
      } else {
        alert("Erreur lors de l'ajout de la chambre.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    } finally {
      setIsSubmittingRoom(false);
    }
  };

  const handleSaveEditRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom || !user) return;

    try {
      let finalPhotoUrl = editingRoom.photoUrl;

      if (editingRoomFile) {
        const formData = new FormData();
        formData.append("file", editingRoomFile);
        formData.append("nom", editingRoom.nomChambre);

        const uploadRes = await fetch(`${API_BASE}/api/upload/local`, {
          method: "POST",
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            finalPhotoUrl = uploadData.url;
          }
        }
      }

      const res = await fetch(`${API_BASE}/api/chambres/${editingRoom.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify({
          ...editingRoom,
          photoUrl: finalPhotoUrl
        })
      });

      if (res.ok) {
        setEditingRoom(null);
        setEditingRoomFile(null);
        setEditingRoomFilePreview("");
        showToast("Chambre modifiée avec succès !");
        loadChambres(selectedRiadId, user.id);
      } else {
        alert("Erreur lors de la modification de la chambre.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    }
  };

  const handleToggleRoomDispo = async (chambre) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/chambres/${chambre.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify({
          ...chambre,
          disponible: !chambre.disponible
        })
      });

      if (res.ok) {
        showToast(`Statut de visibilité mis à jour.`);
        loadChambres(selectedRiadId, user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete || !user) return;
    try {
      const res = await fetch(`${API_BASE}/api/chambres/${roomToDelete.id}`, {
        method: "DELETE",
        headers: { "X-User-Id": user.id }
      });

      if (res.ok) {
        showToast("Chambre supprimée avec succès.");
        setRoomToDelete(null);
        loadChambres(selectedRiadId, user.id);
      } else {
        alert("Impossible de supprimer cette chambre.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeRoomStatut = async (chambreId, newStatut) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/chambres/${chambreId}/statut?statut=${newStatut}`, {
        method: "PUT",
        headers: {
          "X-User-Id": user.id
        }
      });
      if (res.ok) {
        showToast(`Statut de la chambre mis à jour : ${newStatut}`);
        loadChambres(selectedRiadId, user.id);
      } else {
        alert("Erreur lors de la mise à jour du statut.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    }
  };

  const handleUpdateReservationStatus = async (id, newStatut) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${id}/statut?statut=${newStatut}`, {
        method: "PUT",
        headers: { "X-User-Id": user.id }
      });
      if (res.ok) {
        showToast(
          newStatut === "CONFIRMEE"
            ? "Paiement validé ! Réservation confirmée et chambre(s) passée(s) en OCCUPÉE."
            : `Réservation ${newStatut === "REFUSEE" ? "refusée" : "mise à jour"}.`
        );
        loadOwnerData(user.id, selectedRiadId);
      } else {
        alert("Erreur lors de la mise à jour de la réservation.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCheckInModal = (reservation) => {
    setCheckInReservation(reservation);
    const client = reservation.client || {};
    setCheckInForm({
      nom: reservation.clientNom || client.nom || "",
      prenom: reservation.clientPrenom || client.prenom || "",
      email: reservation.clientEmail || client.email || "",
      telephone: reservation.clientTelephone || client.telephone || "",
      typePieceIdentite: reservation.clientTypePieceIdentite || "CIN",
      numeroPieceIdentite: reservation.clientNumeroPieceIdentite || "",
      nationalite: reservation.clientNationalite || "Marocaine",
      dateNaissance: reservation.clientDateNaissance || "",
      nombrePersonnes: reservation.nombrePersonnes || (reservation.chambres && reservation.chambres.length > 0 ? reservation.chambres.reduce((acc, c) => acc + (c.capacite || 2), 0) : 2),
      remarques: reservation.remarquesCheckIn || "",
      paiementEffectueSurPlace: true,
      methodePaiementSurPlace: "ESPECES"
    });
  };

  const handleSubmitCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInReservation || !user) return;
    setIsSubmittingCheckIn(true);
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${checkInReservation.id}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify(checkInForm)
      });
      if (res.ok) {
        const updatedResa = await res.json();
        showToast("✨ Check-in validé avec succès ! Arrivée du client confirmée.");
        setCheckInReservation(null);
        loadOwnerData(user.id, selectedRiadId);
        setViewingCheckInVoucher(updatedResa);
      } else {
        const errorText = await res.text();
        alert("Erreur lors de l'enregistrement du check-in : " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de l'enregistrement du check-in.");
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (profileForm.motDePasse && profileForm.motDePasse !== profileForm.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const body = {
        nom: profileForm.nom,
        prenom: profileForm.prenom,
        telephone: profileForm.telephone
      };
      if (profileForm.motDePasse) {
        body.motDePasse = profileForm.motDePasse;
      }

      const res = await fetch(`${API_BASE}/api/utilisateurs/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const updated = await res.json();
        const merged = { ...user, ...updated };
        localStorage.setItem("user", JSON.stringify(merged));
        setUser(merged);
        showToast("Profil gérant mis à jour avec succès !");
      } else {
        alert("Erreur lors de la mise à jour du profil.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    }
  };

  const handleSubmitDirectBooking = async (e) => {
    e.preventDefault();
    if (!directBookingForm.riadId) {
      alert("Veuillez sélectionner un établissement (Riad).");
      return;
    }
    setIsSubmittingDirectBooking(true);
    try {
      const payload = {
        riadId: directBookingForm.riadId,
        dateDebut: directBookingForm.dateDebut,
        dateFin: directBookingForm.dateFin,
        riadEntier: directBookingForm.riadEntier,
        chambreIds: directBookingForm.riadEntier ? [] : (directBookingForm.chambreId ? [directBookingForm.chambreId] : []),
        nom: directBookingForm.nom || "Client",
        prenom: directBookingForm.prenom || "Direct",
        email: directBookingForm.email || `client.direct.${Date.now()}@riad.ma`,
        telephone: directBookingForm.telephone || "+212 600-000000",
        methodePaiement: directBookingForm.methodePaiement
      };

      const res = await fetch(`${API_BASE}/api/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Erreur lors de la réservation directe.");
      }

      showToast("✓ Réservation directe enregistrée avec succès !");
      setShowDirectBookingModal(false);
      if (user?.id) loadOwnerData(user.id);
    } catch (err) {
      alert(err.message || "Erreur lors de la réservation.");
    } finally {
      setIsSubmittingDirectBooking(false);
    }
  };

  const filteredRiads = riads;
  const filteredReservations = reservations;
  const displayedReservations = filteredReservations.filter((r) => {
    if (reservationFilter === "TOUTES") return true;
    return r.statut === reservationFilter;
  });
  const filteredAlertesNouvelles = alertes.nouvellesReservations || [];
  const filteredAlertesArrivees = alertes.arriveesAujourdhui || [];

  const selectedRiad = riads.find((r) => r.id === selectedRiadId) || riads[0];

  const totalCA = filteredReservations
    .filter((r) => r.statut === "CONFIRMEE")
    .reduce((sum, r) => sum + (r.prixTotal || 0), 0);

  const confirmedReservationsCount = filteredReservations.filter((r) => r.statut === "CONFIRMEE").length;
  const totalChambresCount = chambres.length > 0 ? chambres.length : (riads.length * 3 || 1);
  const tauxOccupation = Math.min(100, Math.max(0, Math.round((confirmedReservationsCount / Math.max(1, totalChambresCount)) * 100)));

  return (
    <div>
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "14px 24px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
            zIndex: 1000,
            fontWeight: 700,
            fontSize: "0.9rem",
            border: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ── VUE 1: TABLEAU DE BORD & ALERTES (tab=dashboard) ────────────────── */}
      {(activeTab === "dashboard" || !activeTab) && (
        <div>
          {/* Header & Quick Actions Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "1.6rem", color: "#0f172a", fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>
                Tableau de Bord
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                Vue d'ensemble opérationnelle et indicateurs de performance de vos Riads.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setDirectBookingForm({
                    riadId: selectedRiad?.id || (riads[0]?.id || ""),
                    chambreId: chambres[0]?.id || "",
                    riadEntier: false,
                    nom: "",
                    prenom: "",
                    email: "",
                    telephone: "",
                    dateDebut: new Date().toISOString().split("T")[0],
                    dateFin: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
                    methodePaiement: "SUR_PLACE"
                  });
                  setShowDirectBookingModal(true);
                }}
                style={{
                  backgroundColor: "var(--terracotta, #d96b43)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(217, 107, 67, 0.35)",
                  transition: "all 0.2s ease"
                }}
              >
                <span>➕</span> Réservation Directe
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                <span>📥</span> Exporter Rapport (PDF)
              </button>
            </div>
          </div>

          {/* 5 Balanced Executive KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px", marginBottom: "32px" }}>
            {/* 1. Établissements */}
            <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "16px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "4px solid var(--terracotta, #d96b43)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Établissements</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta, #d96b43)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                  <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                  <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                </svg>
              </div>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
                {filteredRiads.length} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Riad(s)</span>
              </div>
            </div>

            {/* 2. Capacité */}
            <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "16px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "4px solid #0284c7" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Capacité Totale</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 4v16" />
                  <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                  <path d="M2 17h20" />
                </svg>
              </div>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
                {chambres.length} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Chambres</span>
              </div>
            </div>

            {/* 3. Taux d'Occupation */}
            <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "16px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "4px solid #10b981" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Taux d'Occupation</div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#10b981", backgroundColor: "#dcfce7", padding: "2px 8px", borderRadius: "10px" }}>Actif</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "8px" }}>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a" }}>
                  {tauxOccupation}%
                </div>
                <div style={{ width: "45px", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${tauxOccupation}%`, height: "100%", backgroundColor: "#10b981" }} />
                </div>
              </div>
            </div>

            {/* 4. Séjours Confirmés */}
            <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "16px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "4px solid #06b6d4" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Séjours Confirmés</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
                {filteredReservations.filter((r) => r.statut === "CONFIRMEE").length} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Séjour(s)</span>
              </div>
            </div>

            {/* 5. Chiffre d'Affaires */}
            <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "16px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "4px solid #8b5cf6" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Chiffre d'Affaires</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
                {totalCA.toLocaleString()} <span style={{ fontSize: "0.85rem", color: "#8b5cf6", fontWeight: 800 }}>MAD</span>
              </div>
            </div>
          </div>

          {/* Centre d'Alertes & Décisions */}
          <section style={{ marginBottom: "32px" }}>
            {filteredAlertesNouvelles.length === 0 ? (
              /* Encart discret lorsque 0 demande en attente */
              <div style={{ backgroundColor: "#ffffff", padding: "14px 20px", borderRadius: "14px", border: "1px solid #e2e8f0", borderLeft: "4px solid #10b981", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.86rem", color: "#334155", fontWeight: 700 }}>
                  <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#dcfce7", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 900 }}>✓</span>
                  Toutes les demandes de réservation sont traitées (0 en attente de décision).
                </div>
                <span style={{ fontSize: "0.75rem", color: "#15803d", backgroundColor: "#f0fdf4", fontWeight: 800, padding: "4px 10px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                  À JOUR
                </span>
              </div>
            ) : (
              /* Encart d'alerte prioritaire lorsqu'il y a des demandes à décider */
              <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #fee2e2", borderLeft: "5px solid #ef4444", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ fontWeight: 800, color: "#991b1b", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" x2="12" y1="8" y2="12" />
                      <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    Demandes de Réservation en Attente
                  </div>
                  <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", fontSize: "0.8rem", fontWeight: 800, padding: "6px 14px", borderRadius: "20px" }}>
                    {filteredAlertesNouvelles.length} demande(s) à décider
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  {filteredAlertesNouvelles.map((item) => (
                    <div key={item.id} style={{ backgroundColor: "#fff5f5", padding: "16px", borderRadius: "12px", border: "1px solid #fecaca" }}>
                      <div style={{ fontWeight: 800, color: "#991b1b", fontSize: "0.92rem" }}>Réservation #{item.id.substring(0, 8)}</div>
                      <div style={{ color: "#475569", fontSize: "0.82rem", marginTop: "4px" }}>Séjour : Du {item.dateDebut} au {item.dateFin}</div>
                      <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "0.9rem", marginTop: "4px" }}>Total : {item.prixTotal} MAD</div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                        <button
                          onClick={() => handleUpdateReservationStatus(item.id, "CONFIRMEE")}
                          style={{
                            flex: 1.4,
                            backgroundColor: "#10b981",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px"
                          }}
                          title="Valider le paiement et passer la chambre en OCCUPÉE"
                        >
                          💵 Encaisser & Occuper
                        </button>
                        <button
                          onClick={() => handleUpdateReservationStatus(item.id, "REFUSEE")}
                          style={{
                            flex: 0.8,
                            backgroundColor: "#ef4444",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            cursor: "pointer"
                          }}
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Arrivées du Jour & Check-in */}
            <div style={{ backgroundColor: "#ffffff", padding: "24px 26px", borderRadius: "20px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", borderTop: "4px solid #0284c7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.02rem", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                    🛎️
                  </div>
                  <div>
                    <div>Arrivées du Jour (Check-in)</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Enregistrement & vérification d'identité</div>
                  </div>
                </div>
                <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "0.78rem", fontWeight: 800, padding: "5px 14px", borderRadius: "20px" }}>
                  {filteredAlertesArrivees.length} client(s)
                </span>
              </div>

              {filteredAlertesArrivees.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 12px", color: "#64748b", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>🌴</div>
                  <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600 }}>Aucun check-in prévu pour aujourd'hui.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {filteredAlertesArrivees.map((item) => {
                    const clientName = (item.clientPrenom || item.client?.prenom || "") + " " + (item.clientNom || item.client?.nom || "Client Invité");
                    const roomName = item.riadEntier ? "Riad Entier" : (item.chambres && item.chambres.length > 0 ? item.chambres.map(c => c.nomChambre).join(", ") : "Chambre");
                    const isCheckedIn = Boolean(item.checkInEffectue);

                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: isCheckedIn ? "#f0fdf4" : "#f0f9ff",
                          padding: "16px 18px",
                          borderRadius: "14px",
                          border: isCheckedIn ? "1px solid #bbf7d0" : "1px solid #bae6fd",
                          borderLeft: isCheckedIn ? "5px solid #16a34a" : "5px solid #0284c7"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                          <div>
                            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.94rem" }}>
                              👤 {clientName.trim()}
                            </div>
                            <div style={{ color: "#475569", fontSize: "0.8rem", marginTop: "2px" }}>
                              🛏️ {roomName} • Séjour du <strong>{item.dateDebut}</strong> au <strong>{item.dateFin}</strong>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              padding: "4px 10px",
                              borderRadius: "12px",
                              backgroundColor: isCheckedIn ? "#dcfce7" : "#fef3c7",
                              color: isCheckedIn ? "#15803d" : "#b45309"
                            }}
                          >
                            {isCheckedIn ? "✓ CHECK-IN EFFECTUÉ" : "⏳ ATTENDU"}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "10px", borderTop: isCheckedIn ? "1px solid #dcfce7" : "1px solid #e0f2fe" }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>
                            Total : {item.prixTotal} MAD
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            {!isCheckedIn ? (
                              <button
                                type="button"
                                onClick={() => handleOpenCheckInModal(item)}
                                style={{
                                  backgroundColor: "var(--terracotta, #d96b43)",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "8px",
                                  padding: "7px 14px",
                                  fontSize: "0.8rem",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  boxShadow: "0 2px 10px rgba(217, 107, 67, 0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px"
                                }}
                              >
                                🔑 Effectuer le Check-in
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setViewingCheckInVoucher(item)}
                                style={{
                                  backgroundColor: "#ffffff",
                                  color: "#16a34a",
                                  border: "1px solid #86efac",
                                  borderRadius: "8px",
                                  padding: "6px 12px",
                                  fontSize: "0.78rem",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px"
                                }}
                              >
                                📄 Voir Fiche Check-in
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
          </section>

          {/* ── SUIVI DES RÉSERVATIONS (Intégré dans le Tableau de Bord Opérationnel) ── */}
          <section style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "20px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(217, 107, 67, 0.12)", color: "var(--terracotta, #d96b43)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                    📜
                  </div>
                  Suivi des Réservations & Check-in
                </h2>
                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                  Consultez, enregistrez le check-in des clients à l'arrivée et imprimez les fiches officielles.
                </p>
              </div>

              {/* Filtres par statut */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { label: "Toutes", value: "TOUTES", count: filteredReservations.length },
                  { label: "En Attente", value: "EN_ATTENTE", count: filteredReservations.filter((r) => r.statut === "EN_ATTENTE").length },
                  { label: "Confirmées", value: "CONFIRMEE", count: filteredReservations.filter((r) => r.statut === "CONFIRMEE").length },
                  { label: "Refusées", value: "REFUSEE", count: filteredReservations.filter((r) => r.statut === "REFUSEE").length }
                ].map((f) => {
                  const isActive = reservationFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setReservationFilter(f.value)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "10px",
                        fontSize: "0.8rem",
                        fontWeight: isActive ? 800 : 600,
                        border: isActive ? "1px solid var(--terracotta, #d96b43)" : "1px solid #cbd5e1",
                        backgroundColor: isActive ? "rgba(217, 107, 67, 0.12)" : "#f8fafc",
                        color: isActive ? "var(--terracotta, #d96b43)" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {f.label} ({f.count})
                    </button>
                  );
                })}
              </div>
            </div>

            {displayedReservations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "36px 20px", color: "#64748b" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>Aucune réservation trouvée pour ce filtre.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b" }}>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>ID Réservation</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Client</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Dates Séjour</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Montant</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Statut</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Check-in</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedReservations.map((r) => {
                      const clientName = (r.clientPrenom || r.client?.prenom || "") + " " + (r.clientNom || r.client?.nom || "Invité");
                      const isCheckedIn = Boolean(r.checkInEffectue);

                      return (
                        <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                          <td style={{ padding: "14px 10px", fontWeight: 700, color: "#0f172a" }}>
                            #{r.id.substring(0, 8)}
                          </td>
                          <td style={{ padding: "14px 10px" }}>
                            <div style={{ fontWeight: 800, color: "#0f172a" }}>{clientName.trim()}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{r.clientTelephone || r.client?.telephone || r.clientEmail || r.client?.email || ""}</div>
                          </td>
                          <td style={{ padding: "14px 10px", color: "#475569", fontSize: "0.82rem" }}>
                            Du {r.dateDebut} au {r.dateFin}
                          </td>
                          <td style={{ padding: "14px 10px", fontWeight: 800, color: "#0f172a" }}>
                            {r.prixTotal} MAD
                          </td>
                          <td style={{ padding: "14px 10px" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                backgroundColor:
                                  r.statut === "CONFIRMEE" ? "#dcfce7" : r.statut === "REFUSEE" ? "#fee2e2" : "#fef3c7",
                                color:
                                  r.statut === "CONFIRMEE" ? "#15803d" : r.statut === "REFUSEE" ? "#991b1b" : "#b45309"
                              }}
                            >
                              {r.statut}
                            </span>
                          </td>
                          <td style={{ padding: "14px 10px" }}>
                            {isCheckedIn ? (
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  fontSize: "0.74rem",
                                  fontWeight: 800,
                                  backgroundColor: "#dcfce7",
                                  color: "#15803d",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                ✓ Effectué {r.clientNumeroPieceIdentite ? `(${r.clientNumeroPieceIdentite})` : ""}
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  backgroundColor: "#f1f5f9",
                                  color: "#64748b"
                                }}
                              >
                                Non effectué
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "14px 10px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                              {!isCheckedIn && r.statut !== "ANNULEE" && r.statut !== "REFUSEE" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCheckInModal(r)}
                                  style={{
                                    backgroundColor: "var(--terracotta, #d96b43)",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    fontSize: "0.78rem",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    boxShadow: "0 2px 8px rgba(217, 107, 67, 0.25)"
                                  }}
                                  title="Enregistrer les informations d'identité du client pour le check-in"
                                >
                                  🔑 Check-in
                                </button>
                              )}

                              {isCheckedIn && (
                                <button
                                  type="button"
                                  onClick={() => setViewingCheckInVoucher(r)}
                                  style={{
                                    backgroundColor: "#ffffff",
                                    color: "#0f172a",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    padding: "6px 10px",
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  title="Consulter ou imprimer la fiche de police / check-in"
                                >
                                  📄 Fiche
                                </button>
                              )}

                              {r.statut === "EN_ATTENTE" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReservationStatus(r.id, "REFUSEE")}
                                  style={{ backgroundColor: "#ef4444", color: "#ffffff", border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                                >
                                  Refuser
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── VUE 3: GÉRER / MODIFIER / AJOUTER CHAMBRES (tab=chambres) ─────────── */}
      {activeTab === "chambres" && (
        <div style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
            <div>
              <h2 style={{ fontSize: "1.4rem", color: "#0f172a", fontWeight: 800, margin: 0 }}>
                Gestion des Chambres
              </h2>
            </div>
            <button
              onClick={() => setShowAddRoomModal(true)}
              style={{
                backgroundColor: "var(--terracotta)",
                color: "#ffffff",
                border: "none",
                padding: "12px 22px",
                borderRadius: "10px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.9rem",
                boxShadow: "0 4px 12px rgba(217, 107, 67, 0.25)"
              }}
            >
              ➕ Ajouter une chambre
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {chambres.map((ch) => (
              <div
                key={ch.id}
                style={{
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                  transition: "all 0.3s ease"
                }}
              >
                <div>
                  <div style={{ height: "180px", backgroundColor: "#f1f5f9", position: "relative", overflow: "hidden" }}>
                    <img
                      src={ch.photoUrl}
                      alt={ch.nomChambre}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        backgroundColor:
                          ch.statut === "OCCUPEE"
                            ? "#fee2e2"
                            : ch.statut === "RESERVEE"
                            ? "#fef3c7"
                            : "#dcfce7",
                        color:
                          ch.statut === "OCCUPEE"
                            ? "#991b1b"
                            : ch.statut === "RESERVEE"
                            ? "#b45309"
                            : "#15803d",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        padding: "5px 12px",
                        borderRadius: "20px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        border:
                          ch.statut === "OCCUPEE"
                            ? "1px solid #fecaca"
                            : ch.statut === "RESERVEE"
                            ? "1px solid #fde68a"
                            : "1px solid #bbf7d0"
                      }}
                    >
                      {ch.statut === "OCCUPEE"
                        ? "🔴 Occupée"
                        : ch.statut === "RESERVEE"
                        ? "🟡 Réservée (Paiement sur place)"
                        : "🟢 Disponible"}
                    </span>
                  </div>

                  <div style={{ padding: "18px 20px 10px 20px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                      {ch.nomChambre}
                    </h3>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
                      <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
                        {ch.typeChambre}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>•</span>
                      <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
                        {ch.capacite} pers.
                      </span>
                    </div>

                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--primary-dark)" }}>
                      {ch.prixParNuit} <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>MAD / nuit</span>
                    </div>

                    {/* Sélecteur des 3 États de la Chambre */}
                    <div style={{ marginTop: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        État actuel :
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleChangeRoomStatut(ch.id, "DISPONIBLE")}
                          style={{
                            padding: "6px 2px",
                            borderRadius: "8px",
                            fontSize: "0.74rem",
                            fontWeight: ch.statut === "DISPONIBLE" || !ch.statut ? 800 : 600,
                            backgroundColor: ch.statut === "DISPONIBLE" || !ch.statut ? "#dcfce7" : "#f8fafc",
                            color: ch.statut === "DISPONIBLE" || !ch.statut ? "#15803d" : "#64748b",
                            border: ch.statut === "DISPONIBLE" || !ch.statut ? "2px solid #16a34a" : "1px solid #e2e8f0",
                            cursor: "pointer"
                          }}
                        >
                          🟢 Dispo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeRoomStatut(ch.id, "RESERVEE")}
                          style={{
                            padding: "6px 2px",
                            borderRadius: "8px",
                            fontSize: "0.74rem",
                            fontWeight: ch.statut === "RESERVEE" ? 800 : 600,
                            backgroundColor: ch.statut === "RESERVEE" ? "#fef3c7" : "#f8fafc",
                            color: ch.statut === "RESERVEE" ? "#b45309" : "#64748b",
                            border: ch.statut === "RESERVEE" ? "2px solid #d97706" : "1px solid #e2e8f0",
                            cursor: "pointer"
                          }}
                        >
                          🟡 Réservée
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeRoomStatut(ch.id, "OCCUPEE")}
                          style={{
                            padding: "6px 2px",
                            borderRadius: "8px",
                            fontSize: "0.74rem",
                            fontWeight: ch.statut === "OCCUPEE" ? 800 : 600,
                            backgroundColor: ch.statut === "OCCUPEE" ? "#fee2e2" : "#f8fafc",
                            color: ch.statut === "OCCUPEE" ? "#991b1b" : "#64748b",
                            border: ch.statut === "OCCUPEE" ? "2px solid #ef4444" : "1px solid #e2e8f0",
                            cursor: "pointer"
                          }}
                        >
                          🔴 Occupée
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0 20px 20px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => {
                        setEditingRoom({ ...ch });
                        setEditingRoomFile(null);
                        setEditingRoomFilePreview("");
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: "#0f172a",
                        color: "#ffffff",
                        border: "none",
                        padding: "10px",
                        borderRadius: "10px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => handleToggleRoomDispo(ch)}
                      style={{
                        flex: 1,
                        backgroundColor: ch.disponible ? "#fff1f2" : "#f0fdf4",
                        color: ch.disponible ? "#e11d48" : "#16a34a",
                        border: ch.disponible ? "1px solid #fecdd3" : "1px solid #bbf7d0",
                        padding: "10px",
                        borderRadius: "10px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {ch.disponible ? "🔴 Masquer" : "🟢 Publier"}
                    </button>
                  </div>

                  <button
                    onClick={() => setRoomToDelete(ch)}
                    style={{
                      width: "100%",
                      border: "1px solid #fecdd3",
                      background: "#fff1f2",
                      color: "#e11d48",
                      padding: "9px",
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    🗑️ Supprimer la Chambre
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VUE : PLANNING & CALENDRIER DES DISPONIBILITÉS (tab=planning) ─────────── */}
      {activeTab === "planning" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* En-tête avec Sélecteur de Riad et Sélecteur de Chambre */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px 28px",
              borderRadius: "18px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "1.4rem", color: "#0f172a", fontWeight: 800, margin: "0 0 4px 0" }}>
                  📅 Planning & Calendrier des Disponibilités
                </h2>
                <p style={{ color: "#64748b", margin: 0, fontSize: "0.88rem" }}>
                  Visualisez les jours réservés (🟡 acompte requis) et occupés (🔴 payés/confirmés) pour chaque chambre et le Riad entier.
                </p>
              </div>

              {/* Sélecteur de Riad si le propriétaire en possède plusieurs */}
              {filteredRiads.length > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b" }}>Riad :</span>
                  {filteredRiads.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectRiad(r)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: r.id === selectedRiadId ? 800 : 600,
                        backgroundColor: r.id === selectedRiadId ? "rgba(217, 107, 67, 0.12)" : "#f8fafc",
                        color: r.id === selectedRiadId ? "var(--terracotta)" : "#475569",
                        border: r.id === selectedRiadId ? "1.5px solid var(--terracotta)" : "1px solid #cbd5e1",
                        cursor: "pointer"
                      }}
                    >
                      🏰 {r.nom}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sélecteur de Chambre / Riad Entier */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Filtrer par :
              </span>
              <button
                type="button"
                onClick={() => setSelectedPlanningRoomId("ALL")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: selectedPlanningRoomId === "ALL" ? 800 : 600,
                  backgroundColor: selectedPlanningRoomId === "ALL" ? "var(--terracotta)" : "#f8fafc",
                  color: selectedPlanningRoomId === "ALL" ? "#ffffff" : "#475569",
                  border: selectedPlanningRoomId === "ALL" ? "none" : "1px solid #cbd5e1",
                  cursor: "pointer"
                }}
              >
                Vue Globale
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlanningRoomId("ENTIRE_RIAD")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: selectedPlanningRoomId === "ENTIRE_RIAD" ? 800 : 600,
                  backgroundColor: selectedPlanningRoomId === "ENTIRE_RIAD" ? "var(--terracotta)" : "#f8fafc",
                  color: selectedPlanningRoomId === "ENTIRE_RIAD" ? "#ffffff" : "#475569",
                  border: selectedPlanningRoomId === "ENTIRE_RIAD" ? "none" : "1px solid #cbd5e1",
                  cursor: "pointer"
                }}
              >
                ✨ Riad Entier
              </button>
              {chambres.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedPlanningRoomId(ch.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "0.84rem",
                    fontWeight: selectedPlanningRoomId === ch.id ? 800 : 600,
                    backgroundColor: selectedPlanningRoomId === ch.id ? "var(--terracotta)" : "#f8fafc",
                    color: selectedPlanningRoomId === ch.id ? "#ffffff" : "#475569",
                    border: selectedPlanningRoomId === ch.id ? "none" : "1px solid #cbd5e1",
                    cursor: "pointer"
                  }}
                >
                  🛏️ {ch.nomChambre}
                </button>
              ))}
            </div>
          </div>

          {/* Composant Calendrier des Disponibilités */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0", padding: "8px" }}>
            <AvailabilityCalendar
              planningDates={planningDates}
              selectedRoomId={selectedPlanningRoomId === "ALL" || selectedPlanningRoomId === "ENTIRE_RIAD" ? null : selectedPlanningRoomId}
              isRiadEntier={selectedPlanningRoomId === "ENTIRE_RIAD"}
              interactive={false}
              language={language}
            />
          </div>

          {/* Liste des Réservations associées au planning */}
          <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0" }}>
              📋 Détail des Réservations Enregistrées sur ce Riad
            </h3>

            {planningDates.length === 0 ? (
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>
                Aucune réservation enregistrée pour ce Riad actuellement.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {planningDates.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: item.statut === "OCCUPE" ? "#fef2f2" : "#fffbeb",
                      border: `1.5px solid ${item.statut === "OCCUPE" ? "#fca5a5" : "#fcd34d"}`,
                      borderRadius: "14px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.95rem", color: item.statut === "OCCUPE" ? "#991b1b" : "#92400e" }}>
                        {item.nomChambre || (item.riadEntier ? "Riad Entier" : "Chambre")}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          backgroundColor: item.statut === "OCCUPE" ? "#fee2e2" : "#fef3c7",
                          color: item.statut === "OCCUPE" ? "#b91c1c" : "#b45309",
                          border: `1px solid ${item.statut === "OCCUPE" ? "#fca5a5" : "#fde68a"}`
                        }}
                      >
                        {item.statut === "OCCUPE" ? "🔴 OCCUPÉE (Payée)" : "🟡 RÉSERVÉE (Acompte)"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#334155" }}>
                      📅 <strong>Du {item.dateDebut} au {item.dateFin}</strong>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      Statut : {item.statutReservation || item.statut}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VUE 4: MODIFIER RIAD & SERVICES (tab=riad) ───────────────────────── */}
      {(activeTab === "riad" || activeTab === "nouveau-riad") && selectedRiad && (
        <div style={{ maxWidth: "980px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "20px 24px",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px"
            }}
          >
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--terracotta)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                Gestion de vos Riads
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {services.nom || "Fiche du Riad"}
              </h3>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {filteredRiads.map((r) => {
                const isSelected = r.id === selectedRiadId;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRiad(r)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid var(--terracotta)" : "1px solid #cbd5e1",
                      backgroundColor: isSelected ? "rgba(217, 107, 67, 0.1)" : "#f8fafc",
                      color: isSelected ? "var(--terracotta)" : "#475569",
                      fontWeight: isSelected ? 800 : 600,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      transition: "all 0.2s"
                    }}
                  >
                    <span>🏰</span>
                    {r.nom}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSaveServices}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
              <div style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Fiche Riad</h4>
                  <button type="submit" disabled={isSavingRiad} style={{ backgroundColor: "var(--terracotta)", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                    {isSavingRiad ? "Enregistrement..." : "💾 Enregistrer"}
                  </button>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Nom du Riad *</label>
                  <input
                    type="text"
                    required
                    value={services.nom}
                    onChange={(e) => setServices({ ...services, nom: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "0.9rem" }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Adresse dans la Médina *</label>
                  <input
                    type="text"
                    required
                    value={services.adresse}
                    onChange={(e) => setServices({ ...services, adresse: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>
                    Changer la photo du Riad (depuis votre disque local)
                  </label>
                  <div style={{ display: "flex", gap: "14px", alignItems: "center", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    {(editRiadFilePreview || services.photoUrl) && (
                      <img
                        src={editRiadFilePreview || services.photoUrl}
                        alt="Aperçu Riad"
                        style={{ width: "90px", height: "66px", borderRadius: "8px", objectFit: "cover", border: "1px solid #cbd5e1", flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setEditRiadFile(e.target.files[0]);
                            setEditRiadFilePreview(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                        style={{ width: "100%", fontSize: "0.8rem" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Description commerciale *</label>
                  <textarea rows={5} value={services.description} onChange={(e) => setServices({ ...services, description: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", fontFamily: "inherit" }} />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Tarif Privatisation Riad Entier (MAD / nuit)</label>
                  <input type="number" value={services.prixRiadEntier} onChange={(e) => setServices({ ...services, prixRiadEntier: parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "0.95rem" }} />
                </div>
              </div>

              <div style={{ backgroundColor: "#f8fafc", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", height: "fit-content" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>Services Proposés aux Voyageurs</h4>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>Service Spa & Massage</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>Espace bien-être et soins de relaxation</div>
                  </div>
                  <input type="checkbox" checked={services.hasSpa} onChange={(e) => setServices({ ...services, hasSpa: e.target.checked })} style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--terracotta)" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>Hammam Traditionnel Marocain</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>Bain de vapeur et gommage traditionnel</div>
                  </div>
                  <input type="checkbox" checked={services.hasHammam} onChange={(e) => setServices({ ...services, hasHammam: e.target.checked })} style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--terracotta)" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>Table d'Hôte & Service Traiteur</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>Petits-déjeuners et dîners traditionnels</div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── VUE 5: PARAMÈTRES DE PROFIL DU PROPRIÉTAIRE (tab=parametres) ─────── */}
      {activeTab === "parametres" && (
        <div style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0", maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.6rem", color: "#0f172a", fontWeight: 800, margin: "0 0 8px 0" }}>
              Paramètres du Profil
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
              Gérez vos informations personnelles et sécurisez l'accès à votre Espace Gérant.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>Nom</label>
                <input
                  type="text"
                  required
                  value={profileForm.nom}
                  onChange={(e) => setProfileForm({ ...profileForm, nom: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.92rem", fontWeight: 600 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>Prénom</label>
                <input
                  type="text"
                  required
                  value={profileForm.prenom}
                  onChange={(e) => setProfileForm({ ...profileForm, prenom: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.92rem", fontWeight: 600 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>Email Gérant</label>
              <input
                type="email"
                disabled
                value={profileForm.email}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", color: "#64748b", fontSize: "0.92rem", fontWeight: 600 }}
              />
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>Numéro de Téléphone</label>
              <input
                type="text"
                placeholder="+212 600-000000"
                value={profileForm.telephone}
                onChange={(e) => setProfileForm({ ...profileForm, telephone: e.target.value })}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.92rem", fontWeight: 600 }}
              />
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px", marginTop: "24px" }}>
              <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginBottom: "14px" }}>Sécurité & Mot de Passe</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Nouveau Mot de Passe</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={profileForm.motDePasse}
                    onChange={(e) => setProfileForm({ ...profileForm, motDePasse: e.target.value })}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.92rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Confirmer Mot de Passe</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={profileForm.confirmPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.92rem" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
              <button
                type="submit"
                style={{
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  padding: "14px 36px",
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(15, 23, 42, 0.2)",
                  transition: "all 0.2s ease"
                }}
              >
                💾 Enregistrer les Modifications
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  window.location.href = "/login";
                }}
                style={{
                  backgroundColor: "#fff1f2",
                  color: "#e11d48",
                  border: "1px solid #fecdd3",
                  padding: "14px 28px",
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                🔒 Déconnexion Sécurisée
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODALE AJOUT DE CHAMBRE ────────────────────────────────────────── */}
      {showAddRoomModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "32px", maxWidth: "540px", width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0" }}>Ajouter une nouvelle chambre</h3>

            <form onSubmit={handleAddRoom}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Nom de la chambre *</label>
                <input type="text" required placeholder="ex: Suite Majorelle" value={newRoomData.nomChambre} onChange={(e) => setNewRoomData({ ...newRoomData, nomChambre: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Type de chambre</label>
                  <select value={newRoomData.typeChambre} onChange={(e) => setNewRoomData({ ...newRoomData, typeChambre: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "0.88rem" }}>
                    <option value="SIMPLE">Chambre Simple</option>
                    <option value="DOUBLE">Chambre Double</option>
                    <option value="SUITE">Suite de Luxe</option>
                    <option value="FAMILIALE">Suite Familiale</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Prix / nuit (MAD) *</label>
                  <input type="number" required value={newRoomData.prixParNuit} onChange={(e) => setNewRoomData({ ...newRoomData, prixParNuit: parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "0.9rem" }} />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Photo (depuis votre disque local)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedRoomFile(e.target.files[0]);
                      setRoomFilePreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                  style={{ width: "100%", fontSize: "0.82rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" disabled={isSubmittingRoom} onClick={() => setShowAddRoomModal(false)} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: 700, cursor: isSubmittingRoom ? "not-allowed" : "pointer" }}>Annuler</button>
                <button type="submit" disabled={isSubmittingRoom} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", backgroundColor: "var(--terracotta)", color: "#ffffff", fontWeight: 700, cursor: isSubmittingRoom ? "not-allowed" : "pointer", opacity: isSubmittingRoom ? 0.7 : 1 }}>
                  {isSubmittingRoom ? "⏳ Enregistrement..." : "Créer la Chambre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALE MODIFICATION DE CHAMBRE ─────────────────────────────────── */}
      {editingRoom && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "32px", maxWidth: "540px", width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0" }}>
              Modifier la chambre : {editingRoom.nomChambre}
            </h3>

            <form onSubmit={handleSaveEditRoom}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Nom de la chambre *</label>
                <input type="text" required value={editingRoom.nomChambre} onChange={(e) => setEditingRoom({ ...editingRoom, nomChambre: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Type de chambre</label>
                  <select value={editingRoom.typeChambre} onChange={(e) => setEditingRoom({ ...editingRoom, typeChambre: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "0.88rem" }}>
                    <option value="SIMPLE">Chambre Simple</option>
                    <option value="DOUBLE">Chambre Double</option>
                    <option value="SUITE">Suite de Luxe</option>
                    <option value="FAMILIALE">Suite Familiale</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Prix / nuit (MAD) *</label>
                  <input type="number" required value={editingRoom.prixParNuit} onChange={(e) => setEditingRoom({ ...editingRoom, prixParNuit: parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "0.9rem" }} />
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                  Changer la photo de la chambre (depuis votre disque local)
                </label>
                <div style={{ display: "flex", gap: "14px", alignItems: "center", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  {(editingRoomFilePreview || editingRoom.photoUrl) && (
                    <img
                      src={editingRoomFilePreview || editingRoom.photoUrl}
                      alt="Aperçu Chambre"
                      style={{ width: "84px", height: "64px", borderRadius: "8px", objectFit: "cover", border: "1px solid #cbd5e1", flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEditingRoomFile(e.target.files[0]);
                          setEditingRoomFilePreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                      style={{ width: "100%", fontSize: "0.8rem" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setEditingRoom(null)} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>Annuler</button>
                <button type="submit" style={{ padding: "10px 18px", borderRadius: "10px", border: "none", backgroundColor: "var(--terracotta)", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}>Sauvegarder les modifications</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALE CONFIRMATION DE SUPPRESSION CHAMBRE ───────────────────────── */}
      {roomToDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "32px", maxWidth: "440px", width: "100%", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚠️</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>Supprimer la Chambre ?</h3>
            <p style={{ fontSize: "0.88rem", color: "#64748b", marginBottom: "24px" }}>Êtes-vous sûr de vouloir supprimer la chambre <strong>"{roomToDelete.nomChambre}"</strong> ?</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={() => setRoomToDelete(null)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>Annuler</button>
              <button onClick={confirmDeleteRoom} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}>Oui, Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE CHECK-IN CLIENT À L'ARRIVÉE ───────────────────────────────── */}
      {checkInReservation && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)", border: "1px solid #e2e8f0" }}>
            
            {/* En-tête de Luxe Marocain */}
            <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, var(--terracotta, #d96b43) 100%)", color: "#ffffff", padding: "26px 32px", borderRadius: "24px 24px 0 0", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "14px", backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                    🛎️
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, letterSpacing: "-0.2px" }}>
                      Check-in & Enregistrement Client
                    </h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", opacity: 0.85 }}>
                      Enregistrement d'arrivée au {checkInReservation.riad?.nom || selectedRiad?.nom || "Riad"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckInReservation(null)}
                  style={{ background: "none", border: "none", color: "#ffffff", fontSize: "1.4rem", cursor: "pointer", opacity: 0.8 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Récapitulatif du séjour */}
            <div style={{ padding: "18px 32px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", fontSize: "0.84rem" }}>
              <div>
                <div style={{ color: "#64748b", fontWeight: 600 }}>N° Réservation</div>
                <div style={{ color: "#0f172a", fontWeight: 800 }}>#{checkInReservation.id.substring(0, 8)}</div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontWeight: 600 }}>Dates du Séjour</div>
                <div style={{ color: "#0f172a", fontWeight: 800 }}>Du {checkInReservation.dateDebut} au {checkInReservation.dateFin}</div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontWeight: 600 }}>Hébergement</div>
                <div style={{ color: "#0f172a", fontWeight: 800 }}>{checkInReservation.riadEntier ? "Riad Entier" : (checkInReservation.chambres && checkInReservation.chambres.length > 0 ? checkInReservation.chambres.map(c => c.nomChambre).join(", ") : "Chambre")}</div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontWeight: 600 }}>Montant Total</div>
                <div style={{ color: "var(--terracotta, #d96b43)", fontWeight: 800, fontSize: "0.95rem" }}>{checkInReservation.prixTotal} MAD</div>
              </div>
            </div>

            {/* Formulaire de saisie d'identité */}
            <form onSubmit={handleSubmitCheckIn} style={{ padding: "28px 32px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    required
                    value={checkInForm.nom}
                    onChange={(e) => setCheckInForm({ ...checkInForm, nom: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Prénom du client *
                  </label>
                  <input
                    type="text"
                    required
                    value={checkInForm.prenom}
                    onChange={(e) => setCheckInForm({ ...checkInForm, prenom: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Pièce d'identité : CIN / Passeport */}
              <div style={{ backgroundColor: "#fef3c7", padding: "16px 20px", borderRadius: "14px", border: "1px solid #fde68a", marginBottom: "18px" }}>
                <div style={{ fontSize: "0.86rem", fontWeight: 800, color: "#92400e", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>🪪</span> Informations d'Identité Légale (Fiche de Police)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#78350f", marginBottom: "4px" }}>
                      Type de pièce *
                    </label>
                    <select
                      value={checkInForm.typePieceIdentite}
                      onChange={(e) => setCheckInForm({ ...checkInForm, typePieceIdentite: e.target.value })}
                      style={{ width: "100%", padding: "9px 10px", borderRadius: "8px", border: "1px solid #fcd34d", backgroundColor: "#ffffff", fontWeight: 700, fontSize: "0.85rem", color: "#78350f" }}
                    >
                      <option value="CIN">CIN Marocaine</option>
                      <option value="PASSEPORT">Passeport Étranger</option>
                      <option value="CARTE_SEJOUR">Carte de Séjour</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#78350f", marginBottom: "4px" }}>
                      Numéro de pièce (CIN / Passeport) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: BE890123 / P1234567"
                      value={checkInForm.numeroPieceIdentite}
                      onChange={(e) => setCheckInForm({ ...checkInForm, numeroPieceIdentite: e.target.value.toUpperCase() })}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #fcd34d", backgroundColor: "#ffffff", fontWeight: 800, fontSize: "0.88rem", letterSpacing: "0.5px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#78350f", marginBottom: "4px" }}>
                      Nationalité
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Marocaine"
                      value={checkInForm.nationalite}
                      onChange={(e) => setCheckInForm({ ...checkInForm, nationalite: e.target.value })}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #fcd34d", backgroundColor: "#ffffff", fontWeight: 600, fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#78350f", marginBottom: "4px" }}>
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      value={checkInForm.dateNaissance}
                      onChange={(e) => setCheckInForm({ ...checkInForm, dateNaissance: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #fcd34d", backgroundColor: "#ffffff", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#78350f", marginBottom: "4px" }}>
                      Nombre d'occupants
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={checkInForm.nombrePersonnes}
                      onChange={(e) => setCheckInForm({ ...checkInForm, nombrePersonnes: parseInt(e.target.value) || 1 })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #fcd34d", backgroundColor: "#ffffff", fontSize: "0.85rem", fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              {/* Coordonnées de contact */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Téléphone de contact
                  </label>
                  <input
                    type="tel"
                    value={checkInForm.telephone}
                    onChange={(e) => setCheckInForm({ ...checkInForm, telephone: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Email du voyageur
                  </label>
                  <input
                    type="email"
                    value={checkInForm.email}
                    onChange={(e) => setCheckInForm({ ...checkInForm, email: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>
              </div>

              {/* Encaissement à l'arrivée */}
              <div style={{ backgroundColor: "#f0fdf4", padding: "14px 18px", borderRadius: "12px", border: "1px solid #bbf7d0", marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, color: "#166534", fontSize: "0.88rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={checkInForm.paiementEffectueSurPlace}
                    onChange={(e) => setCheckInForm({ ...checkInForm, paiementEffectueSurPlace: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#16a34a" }}
                  />
                  <span>💵 Confirmer le règlement du séjour ({checkInReservation.prixTotal} MAD)</span>
                </label>
                {checkInForm.paiementEffectueSurPlace && (
                  <div style={{ marginTop: "10px", display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "#15803d", fontWeight: 700 }}>Mode d'encaissement :</span>
                    {["ESPECES", "CARTE_BANCAIRE", "VIREMENT"].map((m) => (
                      <label key={m} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#166534", fontWeight: 600, cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="modePaiementCheckIn"
                          value={m}
                          checked={checkInForm.methodePaiementSurPlace === m}
                          onChange={(e) => setCheckInForm({ ...checkInForm, methodePaiementSurPlace: e.target.value })}
                          style={{ accentColor: "#16a34a" }}
                        />
                        {m === "ESPECES" ? "Espèces" : m === "CARTE_BANCAIRE" ? "Carte TPE" : "Virement"}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarques & Besoins spécifiques */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                  Remarques / Demandes d'accueil (ex: Clés remises, Lit bébé, Petit-déjeuner)
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes internes pour le séjour du client..."
                  value={checkInForm.remarques}
                  onChange={(e) => setCheckInForm({ ...checkInForm, remarques: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.86rem", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  disabled={isSubmittingCheckIn}
                  onClick={() => setCheckInReservation(null)}
                  style={{ padding: "12px 20px", borderRadius: "12px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: 700, cursor: "pointer" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCheckIn}
                  style={{
                    padding: "12px 26px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: isSubmittingCheckIn ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {isSubmittingCheckIn ? "⏳ Validation en cours..." : "✨ Confirmer & Valider le Check-in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALE FICHE CHECK-IN / FICHE DE POLICE (IMPRIMABLE) ─────────────── */}
      {viewingCheckInVoucher && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1250, padding: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", maxWidth: "750px", width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)", border: "1px solid #e2e8f0" }}>
            
            {/* Action Bar */}
            <div style={{ padding: "16px 28px", backgroundColor: "#0f172a", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "20px 20px 0 0" }}>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <span>📋</span> Fiche d'Enregistrement Client (Check-in Validé)
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: "var(--terracotta, #d96b43)",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  🖨️ Imprimer la Fiche
                </button>
                <button
                  type="button"
                  onClick={() => setViewingCheckInVoucher(null)}
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Document Imprimable Officiel */}
            <div id="printable-checkin-sheet" style={{ padding: "36px 40px", color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>
              {/* En-tête Riad */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "20px", marginBottom: "24px" }}>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--terracotta, #d96b43)" }}>
                    🏰 {viewingCheckInVoucher.riad?.nom || selectedRiad?.nom || "Riad Authentique"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "4px" }}>
                    📍 {viewingCheckInVoucher.riad?.adresse || selectedRiad?.adresse || "Médina"}, {viewingCheckInVoucher.riad?.ville || selectedRiad?.ville || "Maroc"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                    Plateforme Officielle MoroccoRiads • Hospitality Management
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>Fiche N°</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a" }}>CHK-{viewingCheckInVoucher.id.substring(0, 8).toUpperCase()}</div>
                  <div style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 800, marginTop: "4px", backgroundColor: "#dcfce7", padding: "3px 8px", borderRadius: "6px", display: "inline-block" }}>
                    ✓ CHECK-IN CONFIRMÉ
                  </div>
                </div>
              </div>

              {/* Titre Document */}
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", color: "#0f172a", margin: 0 }}>
                  Fiche Individuelle de Séjour & d'Accueil
                </h2>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "4px 0 0 0" }}>
                  Enregistrement officiel de l'hôte à l'arrivée (Hospitalité Marocaine)
                </p>
              </div>

              {/* Tableau Données Client */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a", marginBottom: "12px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px" }}>
                    👤 Renseignements du Client
                  </div>
                  <div style={{ fontSize: "0.84rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div><strong>Nom & Prénom :</strong> {viewingCheckInVoucher.clientPrenom || viewingCheckInVoucher.client?.prenom || ""} {viewingCheckInVoucher.clientNom || viewingCheckInVoucher.client?.nom || "Client"}</div>
                    <div><strong>Document d'Identité :</strong> {viewingCheckInVoucher.clientTypePieceIdentite || "CIN"} N° <strong>{viewingCheckInVoucher.clientNumeroPieceIdentite || "Non spécifié"}</strong></div>
                    <div><strong>Nationalité :</strong> {viewingCheckInVoucher.clientNationalite || "Marocaine"}</div>
                    <div><strong>Date de Naissance :</strong> {viewingCheckInVoucher.clientDateNaissance || "N/A"}</div>
                    <div><strong>Téléphone :</strong> {viewingCheckInVoucher.clientTelephone || viewingCheckInVoucher.client?.telephone || "N/A"}</div>
                    <div><strong>Email :</strong> {viewingCheckInVoucher.clientEmail || viewingCheckInVoucher.client?.email || "N/A"}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a", marginBottom: "12px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px" }}>
                    🏨 Détails du Séjour
                  </div>
                  <div style={{ fontSize: "0.84rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div><strong>Date d'Arrivée :</strong> {viewingCheckInVoucher.dateDebut}</div>
                    <div><strong>Date de Départ :</strong> {viewingCheckInVoucher.dateFin}</div>
                    <div><strong>Chambre(s) Assignée(s) :</strong> {viewingCheckInVoucher.riadEntier ? "Location Riad Entier" : (viewingCheckInVoucher.chambres && viewingCheckInVoucher.chambres.length > 0 ? viewingCheckInVoucher.chambres.map(c => c.nomChambre).join(", ") : "Chambre")}</div>
                    <div><strong>Nombre d'occupants :</strong> {viewingCheckInVoucher.nombrePersonnes || 1} personne(s)</div>
                    <div><strong>Montant Total :</strong> {viewingCheckInVoucher.prixTotal} MAD</div>
                    <div><strong>Règlement :</strong> {viewingCheckInVoucher.methodePaiementCheckIn ? `Encaissé sur place (${viewingCheckInVoucher.methodePaiementCheckIn})` : "Confirmé / En ligne"}</div>
                  </div>
                </div>
              </div>

              {/* Remarques */}
              {viewingCheckInVoucher.remarquesCheckIn && (
                <div style={{ backgroundColor: "#fffbeb", padding: "14px", borderRadius: "10px", border: "1px solid #fde68a", marginBottom: "24px", fontSize: "0.84rem" }}>
                  <strong>Notes & Remarques d'accueil :</strong> {viewingCheckInVoucher.remarquesCheckIn}
                </div>
              )}

              {/* Signatures */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "40px", paddingTop: "20px", borderTop: "1px dashed #cbd5e1" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, marginBottom: "48px" }}>
                    Signature du Voyageur / Hôte
                  </div>
                  <div style={{ borderTop: "1px solid #94a3b8", width: "80%", margin: "0 auto", fontSize: "0.75rem", color: "#94a3b8", paddingTop: "4px" }}>
                    Lu et approuvé
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, marginBottom: "48px" }}>
                    Cachet & Signature de l'Établissement
                  </div>
                  <div style={{ borderTop: "1px solid #94a3b8", width: "80%", margin: "0 auto", fontSize: "0.75rem", color: "#94a3b8", paddingTop: "4px" }}>
                    {viewingCheckInVoucher.riad?.nom || selectedRiad?.nom || "Direction du Riad"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE RÉSERVATION DIRECTE (WALK-IN / TÉLÉPHONE) ────────────────── */}
      {showDirectBookingModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0"
            }}
          >
            {/* Header Modale */}
            <div
              style={{
                padding: "20px 28px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8fafc",
                borderTopLeftRadius: "24px",
                borderTopRightRadius: "24px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "rgba(217, 107, 67, 0.12)", color: "var(--terracotta, #d96b43)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                  ➕
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                    Nouvelle Réservation Directe
                  </h3>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Enregistrez un client sur place (Walk-in) ou réservation par téléphone
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectBookingModal(false)}
                style={{ backgroundColor: "transparent", border: "none", fontSize: "1.3rem", color: "#64748b", cursor: "pointer", fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmitDirectBooking} style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Choix du Riad */}
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                    Établissement (Riad) *
                  </label>
                  <select
                    value={directBookingForm.riadId}
                    onChange={(e) => {
                      const newRiadId = e.target.value;
                      setDirectBookingForm((prev) => ({ ...prev, riadId: newRiadId }));
                      loadChambres(newRiadId, user?.id);
                    }}
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600, backgroundColor: "#ffffff" }}
                  >
                    {filteredRiads.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nom} ({r.ville})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Option Riad Entier ou Chambre */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                      Type de Réservation
                    </label>
                    <select
                      value={directBookingForm.riadEntier ? "ENTIER" : "CHAMBRE"}
                      onChange={(e) => setDirectBookingForm((prev) => ({ ...prev, riadEntier: e.target.value === "ENTIER" }))}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}
                    >
                      <option value="CHAMBRE">Chambre Individuelle</option>
                      <option value="ENTIER">Riad Entier (Exclusif)</option>
                    </select>
                  </div>

                  {!directBookingForm.riadEntier && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                        Chambre / Suite *
                      </label>
                      <select
                        value={directBookingForm.chambreId}
                        onChange={(e) => setDirectBookingForm((prev) => ({ ...prev, chambreId: e.target.value }))}
                        required={!directBookingForm.riadEntier}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}
                      >
                        <option value="">-- Choisir une chambre --</option>
                        {chambres.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.nomChambre} ({ch.prixParNuit} MAD/nuit)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Dates Séjour */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                      Date d'Arrivée (Check-in) *
                    </label>
                    <input
                      type="date"
                      value={directBookingForm.dateDebut}
                      onChange={(e) => setDirectBookingForm((prev) => ({ ...prev, dateDebut: e.target.value }))}
                      required
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                      Date de Départ (Check-out) *
                    </label>
                    <input
                      type="date"
                      value={directBookingForm.dateFin}
                      onChange={(e) => setDirectBookingForm((prev) => ({ ...prev, dateFin: e.target.value }))}
                      required
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}
                    />
                  </div>
                </div>

                {/* Données Client */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                      Nom du Client *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Alaoui"
                      value={directBookingForm.nom}
                      onChange={(e) => setDirectBookingForm((prev) => ({ ...prev, nom: e.target.value }))}
                      required
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                      Prénom du Client *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Yassine"
                      value={directBookingForm.prenom}
                      onChange={(e) => setDirectBookingForm((prev) => ({ ...prev, prenom: e.target.value }))}
                      required
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="+212 600-000000"
                      value={directBookingForm.telephone}
                      onChange={(e) => setDirectBookingForm((prev) => ({ ...prev, telephone: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                      Mode de Règlement
                    </label>
                    <select
                      value={directBookingForm.methodePaiement}
                      onChange={(e) => setDirectBookingForm((prev) => ({ ...prev, methodePaiement: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}
                    >
                      <option value="SUR_PLACE">Sur Place (Espèces / TPE)</option>
                      <option value="CARTE_BANCAIRE">Carte Bancaire (Confirmée)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setShowDirectBookingModal(false)}
                  style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDirectBooking}
                  style={{
                    backgroundColor: "var(--terracotta, #d96b43)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 22px",
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(217, 107, 67, 0.35)",
                    opacity: isSubmittingDirectBooking ? 0.7 : 1
                  }}
                >
                  {isSubmittingDirectBooking ? "Enregistrement..." : "✓ Confirmer la Réservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProprietaireDashboard() {
  return (
    <Suspense fallback={<div style={{ padding: "80px", textAlign: "center", color: "#64748b", fontWeight: 700 }}>Chargement du tableau de bord...</div>}>
      <ProprietaireDashboardInner />
    </Suspense>
  );
}
