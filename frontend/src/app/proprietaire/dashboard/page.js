"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

function ProprietaireDashboardInner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const activeTab = searchParams ? searchParams.get("tab") || "dashboard" : "dashboard";

  const [user, setUser] = useState(null);
  const [riads, setRiads] = useState([]);
  const [selectedRiadId, setSelectedRiadId] = useState("");
  const [chambres, setChambres] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [alertes, setAlertes] = useState({ nettoyage: [], arriveesAujourdhui: [], nouvellesReservations: [], stats: {} });
  const [toastMessage, setToastMessage] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("Toutes");
  const [reservationFilter, setReservationFilter] = useState("TOUTES");

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
    if (user) loadChambres(riad.id, user.id);
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

  const handleUpdateReservationStatus = async (id, newStatut) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${id}/statut?statut=${newStatut}`, {
        method: "PATCH",
        headers: { "X-User-Id": user.id }
      });
      if (res.ok) {
        showToast(`Réservation ${newStatut === "CONFIRMEE" ? "confirmée" : "refusée"}.`);
        loadOwnerData(user.id, selectedRiadId);
      }
    } catch (err) {
      console.error(err);
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
  const displayedReservations = filteredReservations.filter((r) => {
    if (reservationFilter === "TOUTES") return true;
    return r.statut === reservationFilter;
  });
  const filteredAlertesNouvelles = alertes.nouvellesReservations || [];
  const filteredAlertesArrivees = alertes.arriveesAujourdhui || [];
  const filteredAlertesNettoyage = alertes.nettoyage || [];

  const selectedRiad = riads.find((r) => r.id === selectedRiadId) || riads[0];

  const totalCA = filteredReservations
    .filter((r) => r.statut === "CONFIRMEE")
    .reduce((sum, r) => sum + (r.prixTotal || 0), 0);

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
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ fontSize: "1.6rem", color: "#0f172a", fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>
              Tableau de Bord
            </h1>
          </div>

          {/* Executive KPI Bar Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "36px" }}>
            <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "4px solid var(--terracotta, #d96b43)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Établissements</div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta, #d96b43)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                  <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                  <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                </svg>
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>{filteredRiads.length} <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>Riad(s)</span></div>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "4px solid #0284c7" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Capacité Totale</div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                  <path d="M2 4v16" />
                  <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                  <path d="M2 17h20" />
                </svg>
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>{chambres.length} <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>Chambres</span></div>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "4px solid #10b981" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Séjours Confirmés</div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>{filteredReservations.filter((r) => r.statut === "CONFIRMEE").length}</div>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "24px 28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "4px solid #8b5cf6" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Chiffre d'Affaires</div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
                {totalCA.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "#8b5cf6", fontWeight: 800 }}>MAD</span>
              </div>
            </div>
          </div>

          {/* Centre d'Alertes */}
          <section style={{ marginBottom: "36px" }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
              <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                    </svg>
                    Arrivées du Jour (Check-in)
                  </div>
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

              <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Nettoyage & Préparation
                  </div>
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
          {/* ── SUIVI DES RÉSERVATIONS (Intégré dans le Tableau de Bord Opérationnel) ── */}
          <section style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "18px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta, #d96b43)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
                    <path d="M12 11h4" />
                    <path d="M12 16h4" />
                    <path d="M8 11h.01" />
                    <path d="M8 16h.01" />
                  </svg>
                  Suivi des Réservations
                </h2>
                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                  Consultez, filtrez et traitez les réservations de votre établissement en temps réel.
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
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Date Début</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Date Fin</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Montant Total</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800 }}>Statut</th>
                      <th style={{ padding: "12px 10px", fontWeight: 800, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedReservations.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "14px 10px", fontWeight: 700, color: "#0f172a" }}>#{r.id.substring(0, 8)}</td>
                        <td style={{ padding: "14px 10px", color: "#475569" }}>{r.dateDebut}</td>
                        <td style={{ padding: "14px 10px", color: "#475569" }}>{r.dateFin}</td>
                        <td style={{ padding: "14px 10px", fontWeight: 800, color: "#0f172a" }}>{r.prixTotal} MAD</td>
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
                        <td style={{ padding: "14px 10px", textAlign: "right" }}>
                          {r.statut === "EN_ATTENTE" && (
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                              <button
                                onClick={() => handleUpdateReservationStatus(r.id, "CONFIRMEE")}
                                style={{ backgroundColor: "#10b981", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Accepter
                              </button>
                              <button
                                onClick={() => handleUpdateReservationStatus(r.id, "REFUSEE")}
                                style={{ backgroundColor: "#ef4444", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                              >
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
                        backgroundColor: ch.disponible ? "#dcfce7" : "#ffe4e6",
                        color: ch.disponible ? "#15803d" : "#991b1b",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        padding: "5px 12px",
                        borderRadius: "20px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                      }}
                    >
                      {ch.disponible ? "Disponible" : "Masquée"}
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
