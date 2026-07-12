"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:8080";

export default function ProprietaireRiads() {
  const [currentUser, setCurrentUser] = useState(null);
  const [riads, setRiads] = useState([]);
  const [selectedRiad, setSelectedRiad] = useState(null);
  const [chambres, setChambres] = useState([]);

  // Chargement & Erreurs
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // États des Modals de création
  const [isRiadModalOpen, setIsRiadModalOpen] = useState(false);
  const [isChambreModalOpen, setIsChambreModalOpen] = useState(false);

  // Formulaires
  const [riadForm, setRiadForm] = useState({
    nom: "",
    description: "",
    adresse: "",
    ville: "Marrakech",
    prixRiadEntier: "",
  });

  const [chambreForm, setChambreForm] = useState({
    nomChambre: "",
    typeChambre: "DOUBLE",
    description: "",
    prixParNuit: "",
    capacite: 2,
  });

  // Photos
  const [riadPhotos, setRiadPhotos] = useState([]);
  const [chambrePhotos, setChambrePhotos] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoTarget, setPhotoTarget] = useState(null); // { type: 'riad', id } ou { type: 'chambre', id, nom }

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchRiads(user.id);
    }
  }, []);

  const fetchRiads = async (userId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/riads/owner`, {
        headers: { "X-User-Id": userId },
      });
      if (!response.ok) {
        throw new Error("Impossible de récupérer la liste de vos Riads.");
      }
      const data = await response.json();
      setRiads(data);

      if (data.length > 0) {
        setSelectedRiad(data[0]);
        fetchChambres(data[0].id);
        fetchRiadPhotos(data[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChambres = async (riadId) => {
    try {
      const response = await fetch(`${API_BASE}/api/riads/${riadId}/chambres`);
      if (!response.ok) {
        throw new Error("Impossible de récupérer les chambres du Riad.");
      }
      const data = await response.json();
      setChambres(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleSelectRiad = (riad) => {
    setSelectedRiad(riad);
    fetchChambres(riad.id);
    fetchRiadPhotos(riad.id);
  };

  const fetchRiadPhotos = async (riadId) => {
    try {
      const res = await fetch(`${API_BASE}/api/riads/${riadId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setRiadPhotos(data);
      }
    } catch (e) {
      console.error("Erreur photos riad:", e);
    }
  };

  const fetchChambrePhotos = async (chambreId) => {
    try {
      const res = await fetch(`${API_BASE}/api/chambres/${chambreId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setChambrePhotos((prev) => ({ ...prev, [chambreId]: data }));
      }
    } catch (e) {
      console.error("Erreur photos chambre:", e);
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !photoTarget) return;
    setUploadingPhoto(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint =
        photoTarget.type === "riad"
          ? `${API_BASE}/api/riads/${photoTarget.id}/photos`
          : `${API_BASE}/api/chambres/${photoTarget.id}/photos`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "X-User-Id": currentUser.id },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors de l'upload.");
      }

      setSuccess("Photo uploadée avec succès !");
      if (photoTarget.type === "riad") {
        fetchRiadPhotos(photoTarget.id);
      } else {
        fetchChambrePhotos(photoTarget.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
      setPhotoTarget(null);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm("Supprimer cette photo ?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/photos/${photoId}`, {
        method: "DELETE",
        headers: { "X-User-Id": currentUser.id },
      });
      if (!res.ok) throw new Error("Impossible de supprimer la photo.");
      setSuccess("Photo supprimée.");
      if (selectedRiad) fetchRiadPhotos(selectedRiad.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRiadSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...riadForm,
        prixRiadEntier: riadForm.prixRiadEntier ? Number(riadForm.prixRiadEntier) : null,
      };

      const response = await fetch(`${API_BASE}/api/riads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser.id,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la création du Riad.");
      }

      setSuccess(`Le Riad "${data.nom}" a été créé avec succès et est en attente de validation admin.`);
      setIsRiadModalOpen(false);

      setRiadForm({
        nom: "",
        description: "",
        adresse: "",
        ville: "Marrakech",
        prixRiadEntier: "",
      });

      fetchRiads(currentUser.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChambreSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...chambreForm,
        prixParNuit: Number(chambreForm.prixParNuit),
        capacite: Number(chambreForm.capacite),
      };

      const response = await fetch(`${API_BASE}/api/riads/${selectedRiad.id}/chambres`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser.id,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'ajout de la chambre.");
      }

      setSuccess(`La chambre "${data.nomChambre}" a été ajoutée avec succès.`);
      setIsChambreModalOpen(false);

      setChambreForm({
        nomChambre: "",
        typeChambre: "DOUBLE",
        description: "",
        prixParNuit: "",
        capacite: 2,
      });

      fetchChambres(selectedRiad.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDisponibilite = async (chambreId, currentStatus) => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_BASE}/api/chambres/${chambreId}/disponibilite?disponible=${!currentStatus}`, {
        method: "PUT",
        headers: {
          "X-User-Id": currentUser.id,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors du changement de disponibilité.");
      }

      setChambres((prev) => prev.map((c) => (c.id === chambreId ? { ...c, disponible: !currentStatus } : c)));
      setSuccess(`Le statut de la chambre "${data.nomChambre}" a été mis à jour.`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* En-tête */}
      <div className="dashboard-header">
        <div>
          <h2 style={{ fontSize: "2.2rem" }}>Vos Hébergements</h2>
          <p style={{ color: "var(--text-secondary)" }}>Configurez vos Riads et gérez les chambres.</p>
        </div>
        <button onClick={() => setIsRiadModalOpen(true)} className="btn btn-primary">
          ＋ Enregistrer un Riad
        </button>
      </div>

      {/* Messages */}
      {error && <div className="auth-error" style={{ marginBottom: "20px" }}>{error}</div>}
      {success && <div className="auth-success" style={{ marginBottom: "20px" }}>{success}</div>}

      <div className="dashboard-grid">
        {/* Colonne Gauche : Riads list */}
        <div className="panel-card">
          <h3>Vos Riads ({riads.length})</h3>
          {riads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-secondary)" }}>
              Vous n'avez pas encore de riad enregistré.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {riads.map((riad) => (
                <button
                  key={riad.id}
                  onClick={() => handleSelectRiad(riad)}
                  className={`list-item-btn ${selectedRiad?.id === riad.id ? "active" : ""}`}
                >
                  <div>
                    <strong style={{ color: "var(--dark)", fontSize: "1rem", display: "block", marginBottom: "4px" }}>
                      {riad.nom}
                    </strong>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{riad.ville}</span>
                  </div>
                  <span className={`badge ${riad.statutValidation === "VALIDE" ? "badge-valide" : "badge-attente"}`}>
                    {riad.statutValidation === "VALIDE" ? "En ligne" : "À valider"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colonne Droite : Chambres & Galerie */}
        <div className="panel-card">
          {selectedRiad ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--gray-light)", paddingBottom: "12px", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ border: "none", margin: 0, padding: 0 }}>
                    Chambres de : {selectedRiad.nom}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {selectedRiad.adresse} · {selectedRiad.ville}
                  </p>
                </div>
                <button onClick={() => setIsChambreModalOpen(true)} className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
                  ＋ Ajouter une chambre
                </button>
              </div>

              {chambres.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-secondary)" }}>
                  Aucune chambre configurée.
                </div>
              ) : (
                <table className="room-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Type</th>
                      <th>Capacité</th>
                      <th>Prix / Nuit</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chambres.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.nomChambre}</strong></td>
                        <td><span style={{ fontSize: "0.8rem", background: "#f1f3f5", padding: "4px 8px", borderRadius: "4px" }}>{c.typeChambre}</span></td>
                        <td>{c.capacite} pers.</td>
                        <td><strong style={{ color: "var(--terracotta)" }}>{c.prixParNuit} MAD</strong></td>
                        <td>
                          <span style={{ color: c.disponible ? "var(--success)" : "var(--danger)", fontWeight: "500" }}>
                            {c.disponible ? "Disponible" : "Bloquée"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => handleToggleDisponibilite(c.id, c.disponible)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", borderColor: c.disponible ? "var(--danger)" : "var(--success)", color: c.disponible ? "var(--danger)" : "var(--success)" }}
                            >
                              {c.disponible ? "Bloquer" : "Rendre dispo."}
                            </button>
                            <button
                              onClick={() => {
                                setPhotoTarget({ type: "chambre", id: c.id, nom: c.nomChambre });
                                fetchChambrePhotos(c.id);
                                document.getElementById("photo-upload-input")?.click();
                              }}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", borderColor: "var(--majorelle)", color: "var(--majorelle)" }}
                            >
                              📷 Photo
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Photos Gallery */}
              <div style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h4 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.15rem", color: "var(--text-primary)", margin: 0 }}>
                    📷 Galerie Photos — {selectedRiad.nom}
                  </h4>
                  <button
                    onClick={() => {
                      setPhotoTarget({ type: "riad", id: selectedRiad.id });
                      document.getElementById("photo-upload-input")?.click();
                    }}
                    disabled={uploadingPhoto}
                    className="btn btn-primary"
                    style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                  >
                    {uploadingPhoto ? "Upload..." : "＋ Ajouter une photo"}
                  </button>
                </div>

                {riadPhotos.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-secondary)", background: "var(--bg-secondary)", borderRadius: "12px", border: "2px dashed var(--border)" }}>
                    <p style={{ fontSize: "2rem", marginBottom: "8px" }}>📷</p>
                    <p>Aucune photo dans la galerie.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                    {riadPhotos.map((photo) => (
                      <div key={photo.id} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "4/3", background: "var(--bg-secondary)" }}>
                        <img src={photo.url} alt="Photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          style={{ position: "absolute", top: "6px", right: "6px", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(239,68,68,0.9)", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)" }}>
              Sélectionnez un Riad à gauche.
            </div>
          )}
        </div>
      </div>

      <input id="photo-upload-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleUploadPhoto} />

      {/* Modal Ajout Riad */}
      {isRiadModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ backgroundColor: "#ffffff", color: "var(--text-primary)" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.6rem" }}>Ajouter un nouveau Riad</h3>
              <button onClick={() => setIsRiadModalOpen(false)} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleRiadSubmit} className="auth-form">
              <div className="form-group">
                <label>Nom du Riad</label>
                <input 
                  type="text" 
                  className="form-input-control" 
                  placeholder="ex: Riad Jasmine Spa" 
                  value={riadForm.nom}
                  onChange={(e) => setRiadForm(prev => ({ ...prev, nom: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="form-input-control" 
                  placeholder="Décrivez votre riad..."
                  style={{ minHeight: "80px", resize: "vertical" }}
                  value={riadForm.description}
                  onChange={(e) => setRiadForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Adresse complète</label>
                <input 
                  type="text" 
                  className="form-input-control" 
                  placeholder="ex: 14 Derb Chorfa, Médina" 
                  value={riadForm.adresse}
                  onChange={(e) => setRiadForm(prev => ({ ...prev, adresse: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ville</label>
                  <select 
                    className="form-input-control"
                    value={riadForm.ville}
                    onChange={(e) => setRiadForm(prev => ({ ...prev, ville: e.target.value }))}
                    required
                  >
                    <option value="Marrakech">Marrakech</option>
                    <option value="Fès">Fès</option>
                    <option value="Essaouira">Essaouira</option>
                    <option value="Chefchaouen">Chefchaouen</option>
                    <option value="Rabat">Rabat</option>
                    <option value="Tanger">Tanger</option>
                    <option value="Casablanca">Casablanca</option>
                    <option value="Agadir">Agadir</option>
                    <option value="Ouarzazate">Ouarzazate</option>
                    <option value="Meknès">Meknès</option>
                    <option value="Taroudant">Taroudant</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prix Riad Entier / Nuit (MAD)</label>
                  <input 
                    type="number" 
                    className="form-input-control" 
                    placeholder="Optionnel"
                    value={riadForm.prixRiadEntier}
                    onChange={(e) => setRiadForm(prev => ({ ...prev, prixRiadEntier: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsRiadModalOpen(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajout Chambre */}
      {isChambreModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ backgroundColor: "#ffffff", color: "var(--text-primary)" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.6rem" }}>Ajouter une chambre à {selectedRiad?.nom}</h3>
              <button onClick={() => setIsChambreModalOpen(false)} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleChambreSubmit} className="auth-form">
              <div className="form-group">
                <label>Nom ou Numéro de la chambre</label>
                <input 
                  type="text" 
                  className="form-input-control" 
                  placeholder="ex: Suite Atlas, Chambre Bahia" 
                  value={chambreForm.nomChambre}
                  onChange={(e) => setChambreForm(prev => ({ ...prev, nomChambre: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type de Chambre</label>
                  <select 
                    className="form-input-control"
                    value={chambreForm.typeChambre}
                    onChange={(e) => setChambreForm(prev => ({ ...prev, typeChambre: e.target.value }))}
                    required
                  >
                    <option value="SINGLE">Single</option>
                    <option value="DOUBLE">Double</option>
                    <option value="TRIPLE">Triple</option>
                    <option value="SUITE">Suite</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Capacité Max (Pers.)</label>
                  <input 
                    type="number" 
                    className="form-input-control" 
                    min="1"
                    value={chambreForm.capacite}
                    onChange={(e) => setChambreForm(prev => ({ ...prev, capacite: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Prix par Nuit (MAD)</label>
                <input 
                  type="number" 
                  className="form-input-control" 
                  min="1"
                  placeholder="ex: 850"
                  value={chambreForm.prixParNuit}
                  onChange={(e) => setChambreForm(prev => ({ ...prev, prixParNuit: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description de la chambre</label>
                <textarea 
                  className="form-input-control" 
                  placeholder="Lit King Size, salle de bain privée..."
                  style={{ minHeight: "80px", resize: "vertical" }}
                  value={chambreForm.description}
                  onChange={(e) => setChambreForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsChambreModalOpen(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
