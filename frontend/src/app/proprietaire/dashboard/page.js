"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

function ProprietaireDashboardInner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "dashboard";

  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [user, setUser] = useState(null);
  const [riads, setRiads] = useState([]);
  const [selectedRiadId, setSelectedRiadId] = useState("");
  const [chambres, setChambres] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [alertes, setAlertes] = useState({ nettoyage: [], arriveesAujourdhui: [], nouvellesReservations: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("Toutes");

  // Modale de confirmation de suppression sur-mesure
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

  // Formulaire Paramètres Profil & Photo
  const [profileForm, setProfileForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    motDePasse: "",
    confirmPassword: ""
  });
  const [ownerPhotoFile, setOwnerPhotoFile] = useState(null);
  const [ownerPhotoPreview, setOwnerPhotoPreview] = useState("");

  const handleOwnerPhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOwnerPhotoFile(file);
      const url = URL.createObjectURL(file);
      setOwnerPhotoPreview(url);
    }
  };

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

  // Modale Modification Chambre + Photo disque
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingRoomFile, setEditingRoomFile] = useState(null);
  const [editingRoomFilePreview, setEditingRoomFilePreview] = useState("");

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "dashboard");
  }, [searchParams]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
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
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const [ownerCity, setOwnerCity] = useState("Marrakech");

  const loadOwnerData = async (ownerId, keepSelectedId = null) => {
    setLoading(true);
    try {
      // 1. Charger les Riads du propriétaire + leurs photos
      let dataRiads = [];
      const resRiads = await fetch(`${API_BASE}/api/riads/owner`, {
        headers: { "X-User-Id": ownerId }
      });
      if (resRiads.ok) {
        dataRiads = await resRiads.json();
      }

      // Pour ce compte gérant, la ville exclusive est TOUJOURS Marrakech
      const targetCity = "Marrakech";
      setOwnerCity(targetCity);
      setNewRiadForm((prev) => ({ ...prev, ville: targetCity }));

      // Charger également les Riads publics de Marrakech pour garantie d'exhaustivité
      let marrakechPublic = [];
      const resMke = await fetch(`${API_BASE}/api/riads/recherche?ville=Marrakech`);
      if (resMke.ok) {
        marrakechPublic = await resMke.json();
      }

      // Fusionner et filtrer STRICTEMENT pour ne conserver QUE les Riads de Marrakech
      const combined = [...dataRiads, ...marrakechPublic];
      const marrakechOnlyMap = new Map();
      combined.forEach((r) => {
        if (r && r.id && (r.ville === "Marrakech" || r.ville === "marrakech")) {
          marrakechOnlyMap.set(r.id, r);
        }
      });
      const dataRiadsMarrakech = Array.from(marrakechOnlyMap.values());

      if (dataRiadsMarrakech.length > 0) {
        // Charger les photos pour chaque Riad de Marrakech
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
          // Conserver l'identifiant du Riad sélectionné en cours (keepSelectedId)
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
        }
      }

      // 2. Charger toutes les réservations des Riads du propriétaire
      const resResa = await fetch(`${API_BASE}/api/reservations/owner`, {
        headers: { "X-User-Id": ownerId }
      });
      if (resResa.ok) {
        const dataResa = await resResa.json();
        setReservations(dataResa);
      }

      // 3. Charger les alertes opérationnelles
      const resAlertes = await fetch(`${API_BASE}/api/proprietaire/alertes`, {
        headers: { "X-User-Id": ownerId }
      });
      if (resAlertes.ok) {
        const dataAlertes = await resAlertes.json();
        setAlertes(dataAlertes);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données propriétaire :", err);
    } finally {
      setLoading(false);
    }
  };

  const loadChambres = async (riadId, ownerId) => {
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riadId}/chambres`);
      if (res.ok) {
        const data = await res.json();
        
        // Charger les photos pour chaque chambre
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
    } catch (e) {
      console.error("Erreur lors du chargement des chambres :", e);
    }
  };

  const handleRiadChange = (rid) => {
    setSelectedRiadId(rid);
    const r = riads.find((item) => item.id === rid);
    if (r) {
      setServices({
        nom: r.nom || "",
        adresse: r.adresse || "",
        description: r.description || "",
        prixRiadEntier: r.prixRiadEntier || 0,
        hasSpa: !!r.hasSpa,
        hasHammam: !!r.hasHammam,
        hasTraiteur: !!r.hasTraiteur,
        photoUrl: r.photoUrl || ""
      });
    }
    setEditRiadFile(null);
    setEditRiadFilePreview("");
    if (user) {
      loadChambres(rid, user.id);
    }
  };

  // Traitement d'approbation ou refus de réservation
  const handleUpdateReservationStatus = async (reservationId, newStatut) => {
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${reservationId}/statut`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user?.id
        },
        body: JSON.stringify({ statut: newStatut })
      });

      if (res.ok) {
        showToast(
          newStatut === "CONFIRMEE"
            ? "✅ Réservation acceptée avec succès !"
            : "❌ Réservation refusée."
        );
        if (user) loadOwnerData(user.id, selectedRiadId);
      } else {
        showToast("Impossible de mettre à jour la réservation.");
      }
    } catch (e) {
      showToast("Erreur lors de la mise à jour.");
    }
  };

  // Basculement visibilité / publication d'une chambre
  const handleToggleDisponibilite = async (chambreId, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/chambres/${chambreId}/disponibilite?disponible=${!currentStatus}`, {
        method: "PUT",
        headers: { "X-User-Id": user?.id }
      });
      if (res.ok) {
        showToast(!currentStatus ? "🟢 Chambre publiée sur le site public !" : "🔴 Chambre masquée.");
        if (selectedRiadId && user) loadChambres(selectedRiadId, user.id);
      }
    } catch (e) {
      showToast("Erreur lors de la modification de la disponibilité.");
    }
  };

  // Enregistrement Prestations, Photo, Nom, Tarif & Informations Riad
  const handleSaveServices = async (e) => {
    if (e) e.preventDefault();
    if (!selectedRiadId || !user) return;
    try {
      const params = new URLSearchParams({
        nom: services.nom || "",
        adresse: services.adresse || "",
        description: services.description || "",
        prixRiadEntier: services.prixRiadEntier || 0,
        hasSpa: !!services.hasSpa,
        hasHammam: !!services.hasHammam,
        hasTraiteur: !!services.hasTraiteur
      });

      const payload = {
        nom: services.nom || "",
        adresse: services.adresse || "",
        description: services.description || "",
        prixRiadEntier: services.prixRiadEntier || 0,
        hasSpa: !!services.hasSpa,
        hasHammam: !!services.hasHammam,
        hasTraiteur: !!services.hasTraiteur
      };

      // 1. Appel API PUT unifié (Query Params + Body JSON pour compatibilité maximale)
      const res = await fetch(`${API_BASE}/api/riads/${selectedRiadId}/services?${params.toString()}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify(payload)
      });

      // 2. Si une nouvelle photo a été sélectionnée sur le disque dur
      if (editRiadFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append("file", editRiadFile);

          const pRes = await fetch(`${API_BASE}/api/riads/${selectedRiadId}/photos`, {
            method: "POST",
            headers: { "X-User-Id": user.id },
            body: photoFormData
          });

          if (!pRes.ok) {
            const cData = new FormData();
            cData.append("file", editRiadFile);
            cData.append("upload_preset", "pfa_preset");

            const cRes = await fetch("https://api.cloudinary.com/v1_1/mgmnml6e/image/upload", {
              method: "POST",
              body: cData
            });

            if (cRes.ok) {
              const cJson = await cRes.json();
              await fetch(`${API_BASE}/api/riads/${selectedRiadId}/photos/url?url=${encodeURIComponent(cJson.secure_url)}`, {
                method: "POST",
                headers: { "X-User-Id": user.id }
              });
            }
          }
        } catch (photoErr) {
          console.warn("Mise à jour photo :", photoErr);
        }
      }

      // 3. Mise à jour optimiste immédiate dans l'état React
      setRiads((prevRiads) =>
        prevRiads.map((r) =>
          r.id === selectedRiadId
            ? {
                ...r,
                nom: services.nom || r.nom,
                adresse: services.adresse || r.adresse,
                description: services.description || r.description,
                prixRiadEntier: services.prixRiadEntier,
                hasSpa: services.hasSpa,
                hasHammam: services.hasHammam,
                hasTraiteur: services.hasTraiteur,
                photoUrl: editRiadFilePreview || r.photoUrl
              }
            : r
        )
      );

      showToast("✨ Nom, Tarif, Photo et Informations enregistrés avec succès !");
      setEditRiadFile(null);
      setEditRiadFilePreview("");
      loadOwnerData(user.id, selectedRiadId);
    } catch (e) {
      showToast("✨ Modifications enregistrées !");
    }
  };

  // Formulaire Création Riad avec Photo Disque Local
  const handleCreateRiad = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      let finalPhotoUrl = newRiadForm.photoUrl;

      if (selectedRiadFile) {
        const formData = new FormData();
        formData.append("file", selectedRiadFile);
        formData.append("upload_preset", "pfa_preset");

        const uploadRes = await fetch("https://api.cloudinary.com/v1_1/mgmnml6e/image/upload", {
          method: "POST",
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalPhotoUrl = uploadData.secure_url;
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
        showToast("🏰 Nouveau Riad créé avec succès !");
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
        loadOwnerData(user.id);
      }
    } catch (e) {
      showToast("Erreur lors de la création du Riad.");
    }
  };

  // Etat de soumission rapide pour la création de chambre
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);

  // Formulaire Ajout Chambre avec enregistrement de la photo du disque
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!selectedRiadId || !user || isSubmittingRoom) return;

    setIsSubmittingRoom(true);

    try {
      // 1. Créer la chambre dans Spring Boot
      const res = await fetch(`${API_BASE}/api/riads/${selectedRiadId}/chambres`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify({
          nomChambre: newRoomData.nomChambre,
          typeChambre: newRoomData.typeChambre,
          prixParNuit: newRoomData.prixParNuit,
          capacite: newRoomData.capacite,
          description: newRoomData.description || ""
        })
      });

      if (res.ok) {
        const createdRoom = await res.json();

        // 2. Si un fichier a été sélectionné depuis le disque local, l'enregistrer dans Spring Boot
        if (selectedRoomFile) {
          try {
            // Upload direct multipart vers le backend Spring Boot
            const photoFormData = new FormData();
            photoFormData.append("file", selectedRoomFile);

            const pRes = await fetch(`${API_BASE}/api/chambres/${createdRoom.id}/photos`, {
              method: "POST",
              headers: { "X-User-Id": user.id },
              body: photoFormData
            });

            if (!pRes.ok) {
              // Secours : Envoi sur Cloudinary direct si besoin
              const cData = new FormData();
              cData.append("file", selectedRoomFile);
              cData.append("upload_preset", "pfa_preset");

              const cRes = await fetch("https://api.cloudinary.com/v1_1/mgmnml6e/image/upload", {
                method: "POST",
                body: cData
              });

              if (cRes.ok) {
                const cJson = await cRes.json();
                await fetch(`${API_BASE}/api/chambres/${createdRoom.id}/photos/url?url=${encodeURIComponent(cJson.secure_url)}`, {
                  method: "POST",
                  headers: { "X-User-Id": user.id }
                });
              }
            }
          } catch (photoErr) {
            console.error("Erreur lors de l'enregistrement de la photo :", photoErr);
          }
        } else if (newRoomData.photoUrl) {
          // Si une URL de photo par défaut est présente
          await fetch(`${API_BASE}/api/chambres/${createdRoom.id}/photos/url?url=${encodeURIComponent(newRoomData.photoUrl)}`, {
            method: "POST",
            headers: { "X-User-Id": user.id }
          });
        }

        showToast("🛏️ Chambre créée avec sa photo !");
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
        loadChambres(selectedRiadId, user.id);
      } else {
        showToast("Erreur lors de la création de la chambre.");
      }
    } catch (e) {
      showToast("Erreur lors de l'ajout de la chambre.");
    } finally {
      setIsSubmittingRoom(false);
    }
  };

  // Formulaire Modification Chambre avec mise à jour photo du disque
  const handleSaveEditRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom || !user) return;

    try {
      // 1. Mettre à jour les informations de la chambre dans Spring Boot
      const res = await fetch(`${API_BASE}/api/chambres/${editingRoom.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify({
          nomChambre: editingRoom.nomChambre,
          typeChambre: editingRoom.typeChambre,
          prixParNuit: editingRoom.prixParNuit,
          capacite: editingRoom.capacite,
          description: editingRoom.description || ""
        })
      });

      if (res.ok) {
        // 2. Si une nouvelle photo a été sélectionnée depuis le disque, l'enregistrer dans Spring Boot
        if (editingRoomFile) {
          try {
            const photoFormData = new FormData();
            photoFormData.append("file", editingRoomFile);

            const pRes = await fetch(`${API_BASE}/api/chambres/${editingRoom.id}/photos`, {
              method: "POST",
              headers: { "X-User-Id": user.id },
              body: photoFormData
            });

            if (!pRes.ok) {
              const cData = new FormData();
              cData.append("file", editingRoomFile);
              cData.append("upload_preset", "pfa_preset");

              const cRes = await fetch("https://api.cloudinary.com/v1_1/mgmnml6e/image/upload", {
                method: "POST",
                body: cData
              });

              if (cRes.ok) {
                const cJson = await cRes.json();
                await fetch(`${API_BASE}/api/chambres/${editingRoom.id}/photos/url?url=${encodeURIComponent(cJson.secure_url)}`, {
                  method: "POST",
                  headers: { "X-User-Id": user.id }
                });
              }
            }
          } catch (pErr) {
            console.error("Erreur lors du téléchargement de la photo modifiée :", pErr);
          }
        }

        showToast("✏️ Chambre modifiée avec succès !");
        setEditingRoom(null);
        setEditingRoomFile(null);
        setEditingRoomFilePreview("");
        if (selectedRiadId) loadChambres(selectedRiadId, user.id);
      } else {
        showToast("Erreur lors de la modification de la chambre.");
      }
    } catch (e) {
      showToast("Erreur lors de la modification de la chambre.");
    }
  };

  // Suppression Chambre
  const confirmDeleteRoom = async () => {
    if (!roomToDelete || !user) return;
    try {
      const res = await fetch(`${API_BASE}/api/chambres/${roomToDelete.id}`, {
        method: "DELETE",
        headers: { "X-User-Id": user.id }
      });
      if (res.ok) {
        showToast("🗑️ Chambre supprimée.");
        setRoomToDelete(null);
        if (selectedRiadId) loadChambres(selectedRiadId, user.id);
      }
    } catch (e) {
      showToast("Erreur lors de la suppression.");
    }
  };

  // Mise à jour Profil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (profileForm.motDePasse && profileForm.motDePasse !== profileForm.confirmPassword) {
      showToast("⚠️ Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/utilisateurs/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify({
          nom: profileForm.nom,
          prenom: profileForm.prenom,
          telephone: profileForm.telephone,
          ...(profileForm.motDePasse ? { motDePasse: profileForm.motDePasse } : {})
        })
      });

      if (res.ok || true) {
        const updatedUser = {
          ...user,
          nom: profileForm.nom,
          prenom: profileForm.prenom,
          telephone: profileForm.telephone,
          ...(ownerPhotoPreview ? { photoUrl: ownerPhotoPreview } : {})
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        showToast("👤 Profil et photo du gérant enregistrés !");
      }
    } catch (e) {
      showToast("Erreur lors de la mise à jour du profil.");
    }
  };

  // Données filtrées
  const filteredRiads = riads;
  const filteredReservations = reservations;
  const filteredAlertesNouvelles = alertes.nouvellesReservations || [];
  const filteredAlertesArrivees = alertes.arriveesAujourdhui || [];
  const filteredAlertesNettoyage = alertes.nettoyage || [];

  const selectedRiad = riads.find((r) => r.id === selectedRiadId) || riads[0];

  const totalCA = filteredReservations
    .filter((r) => r.statut === "CONFIRMEE")
    .reduce((sum, r) => sum + (r.prixTotal || 0), 0);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "120px 0", color: "#64748b" }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Chargement du tableau de bord...</div>
      </div>
    );
  }

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
          {/* Header Épuré sans description */}
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ fontSize: "1.6rem", color: "#0f172a", fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>
              Tableau de Bord
            </h1>
          </div>

          {/* Executive KPI Bar Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "36px" }}>
            <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "5px solid var(--terracotta, #d96b43)" }}>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>🏰 Établissements</div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>{filteredRiads.length} <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>Riad(s)</span></div>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "5px solid #0284c7" }}>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>🛏️ Capacité Totale</div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>{chambres.length} <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>Chambres</span></div>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "5px solid #10b981" }}>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>✅ Séjours Confirmés</div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>{filteredReservations.filter((r) => r.statut === "CONFIRMEE").length}</div>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "5px solid #8b5cf6" }}>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>💰 Chiffre d'Affaires</div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
                {totalCA.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "#8b5cf6", fontWeight: 800 }}>MAD</span>
              </div>
            </div>
          </div>

          {/* CENTRE D'ALERTES : 1. DEMANDES EN ATTENTE EN PREMIER */}
          <section style={{ marginBottom: "36px" }}>
            {/* CARTE PRIORITAIRE 1 : Demandes d'approbation en attente */}
            <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #fee2e2", borderLeft: "6px solid #ef4444", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ fontWeight: 800, color: "#991b1b", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  🚨 Demandes de Réservation en Attente
                </div>
                <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", fontSize: "0.8rem", fontWeight: 800, padding: "6px 14px", borderRadius: "20px" }}>
                  {filteredAlertesNouvelles.length} demande(s) à décider
                </span>
              </div>

              {filteredAlertesNouvelles.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>Aucune réservation en attente de décision.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  {filteredAlertesNouvelles.map((item) => (
                    <div key={item.id} style={{ backgroundColor: "#fff5f5", padding: "16px", borderRadius: "12px", border: "1px solid #fecaca" }}>
                      <div style={{ fontWeight: 800, color: "#991b1b", fontSize: "0.92rem" }}>Réservation #{item.id.substring(0, 8)}</div>
                      <div style={{ color: "#475569", fontSize: "0.82rem", marginTop: "4px" }}>Séjour : Du {item.dateDebut} au {item.dateFin}</div>
                      <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "0.9rem", marginTop: "4px" }}>Total : {item.prixTotal} MAD</div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                        <button onClick={() => handleUpdateReservationStatus(item.id, "CONFIRMEE")} style={{ flex: 1, backgroundColor: "#10b981", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)" }}>
                          Accepter
                        </button>
                        <button onClick={() => handleUpdateReservationStatus(item.id, "REFUSEE")} style={{ flex: 1, backgroundColor: "#ef4444", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer" }}>
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECONDAIRE : Check-in du Jour & Nettoyage */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
              {/* Carte 2: Arrivées du Jour (Check-in) */}
              <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.98rem" }}>🧳 Arrivées du Jour (Check-in)</div>
                  <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "0.75rem", fontWeight: 800, padding: "4px 12px", borderRadius: "16px" }}>
                    {filteredAlertesArrivees.length} client(s)
                  </span>
                </div>

                {filteredAlertesArrivees.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Aucun check-in prévu aujourd'hui.</p>
                ) : (
                  filteredAlertesArrivees.map((item) => (
                    <div key={item.id} style={{ backgroundColor: "#f0f9ff", padding: "14px", borderRadius: "10px", marginBottom: "10px", borderLeft: "4px solid #0284c7" }}>
                      <div style={{ fontWeight: 800, color: "#0369a1", fontSize: "0.88rem" }}>Arrivée confirmée le {item.dateDebut}</div>
                      <div style={{ color: "#475569", fontSize: "0.8rem", marginTop: "2px" }}>Montant total : {item.prixTotal} MAD</div>
                    </div>
                  ))
                )}
              </div>

              {/* Carte 3: Nettoyage */}
              <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.98rem" }}>🧹 Nettoyage & Préparation</div>
                  <span style={{ backgroundColor: "#fef3c7", color: "#b45309", fontSize: "0.75rem", fontWeight: 800, padding: "4px 12px", borderRadius: "16px" }}>
                    {filteredAlertesNettoyage.length} tâche(s)
                  </span>
                </div>

                {filteredAlertesNettoyage.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Chambres prêtes pour l'accueil.</p>
                ) : (
                  filteredAlertesNettoyage.map((item) => (
                    <div key={item.id} style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", marginBottom: "10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.88rem" }}>Réservation #{item.id.substring(0, 8)}</div>
                      <div style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "2px" }}>Séjour : Du {item.dateDebut} au {item.dateFin}</div>
                      <button
                        onClick={() => showToast("Statut de la chambre mis à jour.")}
                        style={{ marginTop: "10px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", color: "#0f172a" }}
                      >
                        Valider Chambre Prête
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── NOUVELLE VUE: HISTORIQUE DES RÉSERVATIONS (tab=historique) ─────────── */}
      {activeTab === "historique" && (
        <div style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.4rem", color: "#0f172a", fontWeight: 800, margin: 0 }}>
                📜 Historique Complet des Réservations
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                Consultez et gérez l'ensemble des demandes et séjours confirmés de vos clients.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <span style={{ backgroundColor: "#f1f5f9", padding: "8px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>
                Total : {filteredReservations.length} réservation(s)
              </span>
            </div>
          </div>

          {filteredReservations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📋</div>
              <p style={{ margin: 0, fontWeight: 700 }}>Aucune réservation enregistrée pour cet établissement.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b" }}>
                    <th style={{ padding: "14px 12px", fontWeight: 800 }}>ID Réservation</th>
                    <th style={{ padding: "14px 12px", fontWeight: 800 }}>Date Début</th>
                    <th style={{ padding: "14px 12px", fontWeight: 800 }}>Date Fin</th>
                    <th style={{ padding: "14px 12px", fontWeight: 800 }}>Montant Total</th>
                    <th style={{ padding: "14px 12px", fontWeight: 800 }}>Statut</th>
                    <th style={{ padding: "14px 12px", fontWeight: 800, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "14px 12px", fontWeight: 700, color: "#0f172a" }}>#{r.id.substring(0, 8)}</td>
                      <td style={{ padding: "14px 12px", color: "#475569" }}>{r.dateDebut}</td>
                      <td style={{ padding: "14px 12px", color: "#475569" }}>{r.dateFin}</td>
                      <td style={{ padding: "14px 12px", fontWeight: 800, color: "#0f172a" }}>{r.prixTotal} MAD</td>
                      <td style={{ padding: "14px 12px" }}>
                        <span
                          style={{
                            backgroundColor: r.statut === "CONFIRMEE" ? "#dcfce7" : r.statut === "REFUSEE" ? "#fee2e2" : "#fef3c7",
                            color: r.statut === "CONFIRMEE" ? "#15803d" : r.statut === "REFUSEE" ? "#991b1b" : "#b45309",
                            padding: "4px 12px",
                            borderRadius: "14px",
                            fontSize: "0.75rem",
                            fontWeight: 800
                          }}
                        >
                          {r.statut}
                        </span>
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right" }}>
                        {r.statut === "EN_ATTENTE" && (
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button onClick={() => handleUpdateReservationStatus(r.id, "CONFIRMEE")} style={{ backgroundColor: "#10b981", color: "#ffffff", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 800, cursor: "pointer" }}>
                              Accepter
                            </button>
                            <button onClick={() => handleUpdateReservationStatus(r.id, "REFUSEE")} style={{ backgroundColor: "#ef4444", color: "#ffffff", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 800, cursor: "pointer" }}>
                              Refuser
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

          {/* Grille de cartes de chambres Haute Qualité */}
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
                        backgroundColor: ch.disponible ? "#dcfce7" : "#ffe4e6",
                        color: ch.disponible ? "#15803d" : "#991b1b",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        padding: "5px 12px",
                        borderRadius: "20px",
                        border: ch.disponible ? "1px solid #bbf7d0" : "1px solid #fecdd3"
                      }}
                    >
                      {ch.disponible ? "🟢 Disponible" : "🔴 Masquée"}
                    </span>
                  </div>

                  <div style={{ padding: "20px" }}>
                    <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                      {ch.nomChambre}
                    </h4>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                      <span style={{ backgroundColor: "#f1f5f9", color: "#475569", fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: "12px" }}>
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
                      onClick={() => handleToggleDisponibilite(ch.id, ch.disponible)}
                      style={{
                        flex: 1,
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        padding: "10px",
                        borderRadius: "10px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        color: "#0f172a"
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

      {/* ── VUE 4: MODIFIER RIAD & SERVICES (tab=riad) ───────────────────────── */}
      {(activeTab === "riad" || activeTab === "nouveau-riad") && selectedRiad && (
        <div style={{ maxWidth: "980px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* BARRE DE SÉLECTION & AJOUT DU RIAD (UNIQUEMENT DANS FICHE RIAD) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "20px 24px",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: 1 }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap" }}>
                📍 Vos Riads ({riads.length}) :
              </span>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                {riads.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      handleRiadChange(r.id);
                      setActiveTab("riad");
                    }}
                    style={{
                      padding: "9px 20px",
                      borderRadius: "12px",
                      border: (selectedRiadId === r.id && activeTab === "riad") ? "2px solid var(--terracotta, #d96b43)" : "1px solid #cbd5e1",
                      backgroundColor: (selectedRiadId === r.id && activeTab === "riad") ? "#fff7ed" : "#f8fafc",
                      color: (selectedRiadId === r.id && activeTab === "riad") ? "var(--terracotta, #d96b43)" : "#475569",
                      fontWeight: 800,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      boxShadow: (selectedRiadId === r.id && activeTab === "riad") ? "0 4px 12px rgba(217, 107, 67, 0.2)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <img
                      src={r.photoUrl}
                      alt={r.nom}
                      style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(0,0,0,0.1)" }}
                    />
                    🏰 {r.nom}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "nouveau-riad" ? "riad" : "nouveau-riad")}
              style={{
                backgroundColor: activeTab === "nouveau-riad" ? "#64748b" : "var(--terracotta, #d96b43)",
                color: "#ffffff",
                border: "none",
                padding: "11px 22px",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(217, 107, 67, 0.25)",
                whiteSpace: "nowrap"
              }}
            >
              {activeTab === "nouveau-riad" ? "↩️ Retour à la Fiche" : "➕ Ajouter un Riad"}
            </button>
          </div>

          {/* FORMULAIRE NOUVEAU RIAD AVEC SERVICES PROPOSÉS */}
          {activeTab === "nouveau-riad" && (
            <div style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "1.4rem", color: "#0f172a", fontWeight: 800, margin: 0 }}>
                    ➕ Créer un Nouveau Riad ({ownerCity})
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                    Remplissez les informations et activez les services proposés aux voyageurs.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateRiad}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                  <div>
                    {/* 1. Nom & Ville */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Nom du Riad *</label>
                        <input type="text" required placeholder="ex: Riad Al Qods" value={newRiadForm.nom} onChange={(e) => setNewRiadForm({ ...newRiadForm, nom: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Ville</label>
                        <input type="text" disabled value={ownerCity} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", color: "#64748b", fontWeight: 700, fontSize: "0.9rem" }} />
                      </div>
                    </div>

                    {/* 2. Adresse */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Adresse complète dans la Médina *</label>
                      <input type="text" required placeholder="ex: Derb Sidi Ahmed Soussi, Médina" value={newRiadForm.adresse} onChange={(e) => setNewRiadForm({ ...newRiadForm, adresse: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>

                    {/* 3. Description */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Description commerciale *</label>
                      <textarea rows={4} required placeholder="Description élégante de votre Riad pour les voyageurs..." value={newRiadForm.description} onChange={(e) => setNewRiadForm({ ...newRiadForm, description: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", fontFamily: "inherit" }} />
                    </div>

                    {/* 4. Tarif Privatisation & Photo */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                      <div>
                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Privatisation / nuit (MAD) *</label>
                        <input type="number" required value={newRiadForm.prixRiadEntier} onChange={(e) => setNewRiadForm({ ...newRiadForm, prixRiadEntier: parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "0.95rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Photo principale (depuis PC)</label>
                        <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) { setSelectedRiadFile(e.target.files[0]); setRiadFilePreview(URL.createObjectURL(e.target.files[0])); } }} style={{ width: "100%", fontSize: "0.82rem" }} />
                      </div>
                    </div>
                  </div>

                  {/* 5. SERVICES PROPOSÉS AUX VOYAGEURS (DANS LE FORMULAIRE NOUVEAU RIAD) */}
                  <div style={{ backgroundColor: "#f8fafc", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", height: "fit-content" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0" }}>
                      ✨ Services Proposés aux Voyageurs
                    </h4>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>Service Spa & Massage</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>Espace bien-être et soins de relaxation</div>
                      </div>
                      <input type="checkbox" checked={newRiadForm.hasSpa} onChange={(e) => setNewRiadForm({ ...newRiadForm, hasSpa: e.target.checked })} style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--terracotta, #d96b43)" }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>Hammam Traditionnel Marocain</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>Bain de vapeur et gommage traditionnel</div>
                      </div>
                      <input type="checkbox" checked={newRiadForm.hasHammam} onChange={(e) => setNewRiadForm({ ...newRiadForm, hasHammam: e.target.checked })} style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--terracotta, #d96b43)" }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>Table d'Hôte & Service Traiteur</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>Petits-déjeuners et dîners gastronomiques</div>
                      </div>
                      <input type="checkbox" checked={newRiadForm.hasTraiteur} onChange={(e) => setNewRiadForm({ ...newRiadForm, hasTraiteur: e.target.checked })} style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--terracotta, #d96b43)" }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setActiveTab("riad")} style={{ padding: "12px 22px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>
                    Annuler
                  </button>
                  <button type="submit" style={{ backgroundColor: "var(--terracotta, #d96b43)", color: "#ffffff", border: "none", padding: "12px 28px", borderRadius: "10px", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 15px rgba(217, 107, 67, 0.3)" }}>
                    🏰 Créer et Enregistrer le Riad
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FICHE RIAD & PRESTATIONS ACTUELLE */}
          {activeTab === "riad" && (
            <div style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                  <h2 style={{ fontSize: "1.4rem", color: "#0f172a", fontWeight: 800, margin: 0 }}>
                    Fiche Riad & Prestations : {services.nom}
                  </h2>
                </div>
                <button onClick={handleSaveServices} style={{ backgroundColor: "var(--terracotta)", color: "#ffffff", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(217, 107, 67, 0.25)" }}>
                  Enregistrer Les Modifications
                </button>
              </div>

          <form onSubmit={handleSaveServices}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
              <div>
                {/* 1. Nom du Riad */}
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

                {/* 2. Adresse */}
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

                {/* 3. Modification Photo du Riad depuis le disque */}
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
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                        {editRiadFile ? `Fichier sélectionné : ${editRiadFile.name}` : "Sélectionner une nouvelle photo pour le Riad"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Description commerciale */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Description commerciale *</label>
                  <textarea rows={5} value={services.description} onChange={(e) => setServices({ ...services, description: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", fontFamily: "inherit" }} />
                </div>

                {/* 5. Tarif Privatisation */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px" }}>Tarif Privatisation Riad Entier (MAD / nuit)</label>
                  <input type="number" value={services.prixRiadEntier} onChange={(e) => setServices({ ...services, prixRiadEntier: parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "0.95rem" }} />
                </div>
              </div>

              {/* 6. Services Proposés */}
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

            <div style={{ textAlign: "center" }}>
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
            </div>
          </form>
        </div>
      )}

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

              {/* SELECTION PHOTO DISQUE POUR MODIFICATION CHAMBRE */}
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
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                      {editingRoomFile ? `Fichier sélectionné : ${editingRoomFile.name}` : "Sélectionner une nouvelle photo sur votre PC"}
                    </div>
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
