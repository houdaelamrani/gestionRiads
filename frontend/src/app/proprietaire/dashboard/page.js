"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

function ProprietaireDashboardInner() {
  const { t, language } = useLanguage();
  const router = useRouter();
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

  // Planning Visuel Hebdomadaire (Dashboard)
  const [scheduleOffset, setScheduleOffset] = useState(0);
  const [selectedScheduleReservation, setSelectedScheduleReservation] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setProfileForm({
          nom: u.nom || "",
          prenom: u.prenom || "",
          email: u.email || "",
          telephone: u.telephone || "",
          motDePasse: "",
          confirmPassword: ""
        });
        loadOwnerData(u.id);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const filterParam = searchParams ? searchParams.get("filter") : null;
    if (filterParam) {
      setReservationFilter(filterParam);
    }
  }, [searchParams]);

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

      if (dataRiads && dataRiads.length > 0) {
        const riadsWithPhotos = await Promise.all(
          dataRiads.map(async (r) => {
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
              photoUrl:
                r.photoUrl ||
                "https://res.cloudinary.com/mgmnml6e/image/upload/v1783959393/j5jlng36f4zyt1vswgou.jpg"
            };
          })
        );

        setRiads(riadsWithPhotos);

        const activeId =
          keepSelectedId && riadsWithPhotos.some((r) => r.id === keepSelectedId)
            ? keepSelectedId
            : riadsWithPhotos[0].id;

        const activeRiad =
          riadsWithPhotos.find((r) => r.id === activeId) || riadsWithPhotos[0];
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
      } else {
        setRiads([]);
        setChambres([]);
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

  const handleSubmitDirectBooking = async (e) => {
    e.preventDefault();
    if (!directBookingForm.riadId) {
      alert("Veuillez sélectionner un Riad.");
      return;
    }
    if (!directBookingForm.riadEntier && !directBookingForm.chambreId) {
      alert("Veuillez sélectionner au moins une chambre.");
      return;
    }
    setIsSubmittingDirectBooking(true);
    try {
      const payload = {
        riadId: directBookingForm.riadId,
        dateDebut: directBookingForm.dateDebut,
        dateFin: directBookingForm.dateFin,
        riadEntier: Boolean(directBookingForm.riadEntier),
        chambreIds: directBookingForm.riadEntier ? [] : [directBookingForm.chambreId],
        methodePaiement: directBookingForm.methodePaiement || "SUR_PLACE",
        nom: directBookingForm.nom,
        prenom: directBookingForm.prenom,
        telephone: directBookingForm.telephone,
        email: directBookingForm.email || `${directBookingForm.nom.toLowerCase().replace(/\s+/g, '')}@direct-guest.ma`
      };

      const res = await fetch(`${API_BASE}/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user ? { "X-User-Id": user.id } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("✓ Réservation directe enregistrée avec succès !");
        setShowDirectBookingModal(false);
        if (user) {
          loadOwnerData(user.id, directBookingForm.riadId);
        }
      } else {
        const errorText = await res.text();
        alert("Erreur lors de la réservation directe : " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de la réservation directe.");
    } finally {
      setIsSubmittingDirectBooking(false);
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

  const filteredRiads = riads;
  const filteredReservations = reservations;
  const todayStr = new Date().toISOString().split("T")[0];

  const displayedReservations = filteredReservations.filter((r) => {
    if (reservationFilter === "TOUTES") return true;
    if (reservationFilter === "ARRIVEES") {
      return (
        r.statut !== "ANNULEE" &&
        r.statut !== "REFUSEE" &&
        (r.dateDebut === todayStr ||
          (!r.checkInEffectue && r.dateDebut <= todayStr && r.dateFin >= todayStr))
      );
    }
    return r.statut === reservationFilter;
  });
  const filteredAlertesNouvelles = alertes.nouvellesReservations || [];
  const filteredAlertesArrivees = alertes.arriveesAujourdhui || [];
  const filteredAlertesDeparts = filteredReservations.filter((r) => {
    return (
      r.statut === "CONFIRMEE" &&
      (r.dateFin === todayStr || (r.dateFin <= todayStr && r.checkInEffectue))
    );
  });

  const selectedRiad = riads.find((r) => r.id === selectedRiadId) || riads[0];

  const totalCA = filteredReservations
    .filter((r) => r.statut === "CONFIRMEE")
    .reduce((sum, r) => sum + (r.prixTotal || 0), 0);

  const confirmedReservationsCount = filteredReservations.filter((r) => r.statut === "CONFIRMEE").length;
  const totalChambresCount = chambres.length > 0 ? chambres.length : (riads.length * 3 || 1);
  const tauxOccupation = Math.min(100, Math.max(0, Math.round((confirmedReservationsCount / Math.max(1, totalChambresCount)) * 100)));

  // Calcul des 7 jours du planning hebdomadaire
  const getWeekDays = () => {
    const days = [];
    const base = new Date();
    base.setDate(base.getDate() + scheduleOffset);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("fr-FR", { weekday: "short" });
      const dayNumber = d.getDate();
      const monthName = d.toLocaleDateString("fr-FR", { month: "short" });
      const isToday = iso === new Date().toISOString().split("T")[0];
      days.push({
        iso,
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        dayNumber,
        monthName,
        isToday,
        fullFormatted: `${dayNumber} ${monthName}`
      });
    }
    return days;
  };
  const weekDays = getWeekDays();

  const getRoomBookingForDay = (chambreId, dayIso) => {
    return filteredReservations.find((r) => {
      if (r.statut === "REFUSEE" || r.statut === "ANNULEE") return false;
      const inRange =
        (r.dateDebut <= dayIso && dayIso < r.dateFin) ||
        (r.dateDebut === dayIso && r.dateFin === dayIso);
      if (!inRange) return false;
      if (r.riadEntier) return true;
      return r.chambres && r.chambres.some((c) => c.id === chambreId);
    });
  };

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

      {/* ── VUE 1: TABLEAU DE BORD EXÉCUTIF (tab=dashboard) ────────────────── */}
      {(activeTab === "dashboard" || !activeTab) && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontSize: "1.6rem", color: "#0f172a", fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>
              Tableau de Bord
            </h1>
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

          {/* 1. PLANNING VISUEL DE LA SEMAINE (Disponibilités en Direct) */}
          <section
            style={{
              backgroundColor: "#ffffff",
              padding: "26px 28px",
              borderRadius: "20px",
              boxShadow: "0 4px 20px -2px rgba(0,0,0,0.06)",
              border: "1px solid #e2e8f0",
              borderTop: "4px solid var(--terracotta, #d96b43)",
              marginBottom: "32px"
            }}
          >
            {/* Header du Planning avec Navigation Temporelle */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "22px",
                flexWrap: "wrap",
                gap: "14px"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "1.2rem", color: "#0f172a", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta, #d96b43)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    Planning des Disponibilités (Semaine)
                  </h2>
                  {riads.length > 1 ? (
                    <select
                      value={selectedRiadId}
                      onChange={(e) => {
                        const targetRiad = riads.find((r) => r.id === e.target.value);
                        if (targetRiad) handleSelectRiad(targetRiad);
                      }}
                      style={{
                        backgroundColor: "rgba(217, 107, 67, 0.12)",
                        color: "var(--terracotta, #d96b43)",
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        padding: "6px 12px",
                        borderRadius: "12px",
                        border: "1px solid rgba(217, 107, 67, 0.3)",
                        cursor: "pointer",
                        outline: "none"
                      }}
                    >
                      {riads.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nom} ({r.ville})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      style={{
                        backgroundColor: "rgba(217, 107, 67, 0.12)",
                        color: "var(--terracotta, #d96b43)",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: "12px"
                      }}
                    >
                      {selectedRiad?.nom || "Votre Riad"}
                    </span>
                  )}
                </div>
              </div>

              {/* Boutons de Navigation de la Semaine */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setScheduleOffset((prev) => prev - 7)}
                  style={{
                    backgroundColor: "#f8fafc",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "7px 12px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Précédent
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleOffset(0)}
                  style={{
                    backgroundColor: scheduleOffset === 0 ? "var(--terracotta, #d96b43)" : "#ffffff",
                    color: scheduleOffset === 0 ? "#ffffff" : "#0f172a",
                    border: scheduleOffset === 0 ? "none" : "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "7px 14px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Aujourd'hui
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleOffset((prev) => prev + 7)}
                  style={{
                    backgroundColor: "#f8fafc",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "7px 12px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  Suivant
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>

            {/* Matrice des Disponibilités : Chambres x 7 Jours */}
            {chambres.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>Aucune chambre configurée pour ce Riad.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "6px 8px", fontSize: "0.84rem" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "#64748b", fontWeight: 800, fontSize: "0.78rem", textTransform: "uppercase", width: "190px" }}>
                        Chambres ({chambres.length})
                      </th>
                      {weekDays.map((d, idx) => {
                        const isToday = d.iso === new Date().toISOString().split("T")[0];
                        return (
                          <th
                            key={idx}
                            style={{
                              textAlign: "center",
                              padding: "8px 6px",
                              backgroundColor: isToday ? "rgba(217, 107, 67, 0.12)" : "#f8fafc",
                              borderRadius: "10px",
                              border: isToday ? "1.5px solid var(--terracotta, #d96b43)" : "1px solid #e2e8f0"
                            }}
                          >
                            <div style={{ fontSize: "0.72rem", color: isToday ? "var(--terracotta, #d96b43)" : "#64748b", fontWeight: 800, textTransform: "uppercase" }}>
                              {d.dayName}
                            </div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: isToday ? "var(--terracotta, #d96b43)" : "#0f172a" }}>
                              {d.dayNum}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {chambres.map((c) => (
                      <tr key={c.id}>
                        {/* Colonne Chambre */}
                        <td style={{ padding: "8px 12px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.86rem" }}>{c.nomChambre}</div>
                          <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600 }}>{c.prixParNuit} MAD / nuit</div>
                        </td>

                        {/* 7 Jours de la Semaine */}
                        {weekDays.map((d, idx) => {
                          const booking = getRoomBookingForDay(c.id, d.iso);
                          const isOccupied = Boolean(booking);
                          const isCheckInDay = isOccupied && booking.dateDebut === d.iso;
                          const clientName = isOccupied
                            ? (booking.clientPrenom || booking.client?.prenom || "") + " " + (booking.clientNom || booking.client?.nom || "Invité")
                            : "";

                          return (
                            <td
                              key={idx}
                              onClick={() => {
                                if (isOccupied) {
                                  setSelectedScheduleReservation(booking);
                                } else {
                                  setDirectBookingForm({
                                    riadId: selectedRiad?.id || (riads[0]?.id || ""),
                                    chambreId: c.id,
                                    riadEntier: false,
                                    nom: "",
                                    prenom: "",
                                    email: "",
                                    telephone: "",
                                    dateDebut: d.iso,
                                    dateFin: new Date(new Date(d.iso).getTime() + 86400000).toISOString().split("T")[0],
                                    methodePaiement: "SUR_PLACE"
                                  });
                                  setShowDirectBookingModal(true);
                                }
                              }}
                              style={{
                                textAlign: "center",
                                padding: "10px 6px",
                                borderRadius: "12px",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                backgroundColor: isOccupied
                                  ? isCheckInDay
                                    ? "#fef3c7"
                                    : "#fee2e2"
                                  : "#f0fdf4",
                                border: isOccupied
                                  ? isCheckInDay
                                    ? "1.5px solid #fde68a"
                                    : "1.5px solid #fca5a5"
                                  : "1px solid #bbf7d0",
                                verticalAlign: "middle"
                              }}
                              title={
                                isOccupied
                                  ? `Occupée par ${clientName.trim()} (${booking.prixTotal} MAD) - Cliquer pour détails`
                                  : `Libre (${c.prixParNuit} MAD) - Cliquer pour réservation directe`
                              }
                            >
                              {isOccupied ? (
                                <div>
                                  <div
                                    style={{
                                      fontSize: "0.72rem",
                                      fontWeight: 800,
                                      color: isCheckInDay ? "#92400e" : "#991b1b",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: "100px",
                                      margin: "0 auto",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "4px"
                                    }}
                                  >
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: isCheckInDay ? "#d97706" : "#dc2626", display: "inline-block" }} />
                                    {clientName.trim().split(" ")[0]}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      color: isCheckInDay ? "#b45309" : "#b91c1c",
                                      marginTop: "2px"
                                    }}
                                  >
                                    {isCheckInDay ? "Arrivée" : "Occupé"}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16a34a", display: "inline-block" }} />
                                    Libre
                                  </div>
                                  <div style={{ fontSize: "0.65rem", color: "#16a34a", fontWeight: 600, marginTop: "2px" }}>
                                    {c.prixParNuit} MAD
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Légende du Planning */}
            <div
              style={{
                display: "flex",
                gap: "18px",
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px solid #f1f5f9",
                fontSize: "0.76rem",
                color: "#64748b",
                fontWeight: 700,
                flexWrap: "wrap"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a", display: "inline-block" }} />
                <span>Chambre Libre (Cliquer pour réserver)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#dc2626", display: "inline-block" }} />
                <span>Chambre Occupée (Cliquer pour détails)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#d97706", display: "inline-block" }} />
                <span>Arrivée / Check-in prévu ce jour</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Modale Rapide Détails Séjour depuis le Planning */}
      {selectedScheduleReservation && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
              padding: "26px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Détails de la Réservation
              </div>
              <button
                type="button"
                onClick={() => setSelectedScheduleReservation(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {(selectedScheduleReservation.clientPrenom || selectedScheduleReservation.client?.prenom || "") + " " + (selectedScheduleReservation.clientNom || selectedScheduleReservation.client?.nom || "Client Invité")}
              </div>
              <div style={{ color: "#475569", fontSize: "0.82rem", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {selectedScheduleReservation.clientTelephone || selectedScheduleReservation.client?.telephone || "Non renseigné"}
              </div>
              <div style={{ color: "#475569", fontSize: "0.82rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {selectedScheduleReservation.clientEmail || selectedScheduleReservation.client?.email || "Non renseigné"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px", fontSize: "0.85rem" }}>
              <div style={{ backgroundColor: "#f1f5f9", padding: "10px", borderRadius: "8px" }}>
                <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700 }}>DATES DU SÉJOUR</div>
                <div style={{ fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                  {selectedScheduleReservation.dateDebut} au {selectedScheduleReservation.dateFin}
                </div>
              </div>

              <div style={{ backgroundColor: "#f1f5f9", padding: "10px", borderRadius: "8px" }}>
                <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700 }}>MONTANT TOTAL</div>
                <div style={{ fontWeight: 800, color: "var(--terracotta, #d96b43)", marginTop: "2px" }}>
                  {selectedScheduleReservation.prixTotal} MAD
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {!selectedScheduleReservation.checkInEffectue ? (
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedScheduleReservation;
                    setSelectedScheduleReservation(null);
                    handleOpenCheckInModal(item);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "var(--terracotta, #d96b43)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Effectuer le Check-in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedScheduleReservation;
                    setSelectedScheduleReservation(null);
                    setViewingCheckInVoucher(item);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Voir Fiche de Police
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedScheduleReservation(null)}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#64748b",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VUE 2: GESTION COMPLÈTE DES RÉSERVATIONS & CHECK-IN (tab=reservations) ── */}
      {activeTab === "reservations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header & Quick Action */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "1.6rem", color: "#0f172a", fontWeight: 800, margin: 0 }}>
                Gestion des Réservations & Check-in
              </h1>
            </div>

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
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(217, 107, 67, 0.35)"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nouvelle Réservation Directe
            </button>
          </div>

          {/* Tableau Principal avec Filtres Intégrés */}
          <section style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "20px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { label: "Toutes", value: "TOUTES", count: filteredReservations.length },
                  { label: "En Attente", value: "EN_ATTENTE", count: filteredReservations.filter((r) => r.statut === "EN_ATTENTE").length, dotColor: "#ef4444" },
                  { label: "Arrivées du Jour", value: "ARRIVEES", count: filteredAlertesArrivees.length, dotColor: "#0284c7" },
                  { label: "Confirmées", value: "CONFIRMEE", count: filteredReservations.filter((r) => r.statut === "CONFIRMEE").length, dotColor: "#10b981" },
                  { label: "Refusées", value: "REFUSEE", count: filteredReservations.filter((r) => r.statut === "REFUSEE").length, dotColor: "#94a3b8" }
                ].map((f) => {
                  const isActive = reservationFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setReservationFilter(f.value)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        fontSize: "0.82rem",
                        fontWeight: isActive ? 800 : 600,
                        border: isActive ? "2px solid var(--terracotta, #d96b43)" : "1px solid #cbd5e1",
                        backgroundColor: isActive ? "rgba(217, 107, 67, 0.12)" : "#f8fafc",
                        color: isActive ? "var(--terracotta, #d96b43)" : "#475569",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s"
                      }}
                    >
                      {f.dotColor && (
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: f.dotColor, display: "inline-block" }} />
                      )}
                      {f.label}
                      <span
                        style={{
                          backgroundColor: isActive ? "var(--terracotta, #d96b43)" : "#e2e8f0",
                          color: isActive ? "#ffffff" : "#475569",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "2px 7px",
                          borderRadius: "10px"
                        }}
                      >
                        {f.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {displayedReservations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                <div style={{ marginBottom: "8px" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>Aucune réservation trouvée pour ce filtre.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b" }}>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>ID Réservation</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Client & Contact</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Dates Séjour</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Montant</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Statut</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Check-in Client</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800, textAlign: "right" }}>Actions Opérationnelles</th>
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
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    boxShadow: "0 2px 8px rgba(217, 107, 67, 0.25)"
                                  }}
                                  title="Enregistrer les informations d'identité du client pour le check-in"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                  Check-in
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
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px"
                                  }}
                                  title="Consulter ou imprimer la fiche de police / check-in"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                  Fiche
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "1.4rem", color: "#0f172a", fontWeight: 800, margin: 0 }}>
                Gestion des Chambres
              </h2>
              {riads.length > 1 && (
                <select
                  value={selectedRiadId}
                  onChange={(e) => {
                    const targetRiad = riads.find((r) => r.id === e.target.value);
                    if (targetRiad) handleSelectRiad(targetRiad);
                  }}
                  style={{
                    backgroundColor: "rgba(217, 107, 67, 0.12)",
                    color: "var(--terracotta, #d96b43)",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    padding: "6px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(217, 107, 67, 0.3)",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  {riads.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nom} ({r.ville})
                    </option>
                  ))}
                </select>
              )}
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
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(217, 107, 67, 0.25)"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter une chambre
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
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor:
                            ch.statut === "OCCUPEE"
                              ? "#dc2626"
                              : ch.statut === "RESERVEE"
                              ? "#d97706"
                              : "#16a34a"
                        }}
                      />
                      {ch.statut === "OCCUPEE"
                        ? "Occupée"
                        : ch.statut === "RESERVEE"
                        ? "Réservée (Sur place)"
                        : "Disponible"}
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
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px"
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16a34a" }} />
                          Dispo
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
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px"
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#d97706" }} />
                          Réservée
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
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px"
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#dc2626" }} />
                          Occupée
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
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Modifier
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
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {ch.disponible ? "Masquer" : "Publier"}
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
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Supprimer la Chambre
                  </button>
                </div>
              </div>
            ))}
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
              <h2 style={{ fontSize: "1.4rem", color: "#0f172a", fontWeight: 800, margin: 0 }}>
                Gestion des Riads
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {filteredRiads.map((r) => {
                const isSelected = r.id === selectedRiadId;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRiad(r)}
                    style={{
                      display: "inline-flex",
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg>
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
                  <button type="submit" disabled={isSavingRiad} style={{ backgroundColor: "var(--terracotta)", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    {isSavingRiad ? "Enregistrement..." : "Enregistrer"}
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
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h2 style={{ fontSize: "1.6rem", color: "#0f172a", fontWeight: 800, margin: 0 }}>
              Paramètres du Profil
            </h2>
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
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Enregistrer les Modifications
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Déconnexion Sécurisée
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
                  {isSubmittingRoom ? "Enregistrement..." : "Créer la Chambre"}
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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
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
                  <div style={{ width: "46px", height: "46px", borderRadius: "14px", backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  Informations d'Identité Légale (Fiche de Police)
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
                  <span>Confirmer le règlement du séjour ({checkInReservation.prixTotal} MAD)</span>
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
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {isSubmittingCheckIn ? "Validation en cours..." : "Confirmer & Valider le Check-in"}
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Fiche d'Enregistrement Client (Check-in Validé)
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
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                  Imprimer la Fiche
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
                    {viewingCheckInVoucher.riad?.nom || selectedRiad?.nom || "Riad Authentique"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "4px" }}>
                    {viewingCheckInVoucher.riad?.adresse || selectedRiad?.adresse || "Médina"}, {viewingCheckInVoucher.riad?.ville || selectedRiad?.ville || "Maroc"}
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
                  <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a", marginBottom: "12px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Renseignements du Client
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
                  <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a", marginBottom: "12px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    Détails du Séjour
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
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "rgba(217, 107, 67, 0.12)", color: "var(--terracotta, #d96b43)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
                    opacity: isSubmittingDirectBooking ? 0.7 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {isSubmittingDirectBooking ? "Enregistrement..." : "Confirmer la Réservation"}
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
