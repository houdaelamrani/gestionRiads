/**
 * Configuration globale de l'API Backend.
 * Modifiez cette constante pour changer l'URL du backend dans toute l'application.
 */
export const API_BASE = "http://localhost:8080";

/**
 * Helpers HTTP centralisés avec gestion automatique du header X-User-Id.
 */

/**
 * Effectue un GET authentifié vers l'API backend.
 * @param {string} path - Chemin de l'API (ex: "/api/riads/owner")
 * @param {string|null} userId - UUID de l'utilisateur connecté (optionnel)
 */
export async function apiGet(path, userId = null) {
  const headers = { "Content-Type": "application/json" };
  if (userId) headers["X-User-Id"] = userId;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
  return res.json();
}

/**
 * Effectue un POST authentifié vers l'API backend.
 * @param {string} path - Chemin de l'API
 * @param {object} body - Corps de la requête (sera sérialisé en JSON)
 * @param {string|null} userId - UUID de l'utilisateur connecté (optionnel)
 */
export async function apiPost(path, body, userId = null) {
  const headers = { "Content-Type": "application/json" };
  if (userId) headers["X-User-Id"] = userId;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
  return res.json();
}

/**
 * Effectue un PUT authentifié vers l'API backend.
 * @param {string} path - Chemin de l'API
 * @param {object|null} body - Corps de la requête (optionnel)
 * @param {string|null} userId - UUID de l'utilisateur connecté (optionnel)
 */
export async function apiPut(path, body = null, userId = null) {
  const headers = { "Content-Type": "application/json" };
  if (userId) headers["X-User-Id"] = userId;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
  // Certains endpoints renvoient void (204 No Content)
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Mappe les anciennes photos de test Unsplash vers les nouvelles photos professionnelles Cloudinary
 * pour s'assurer que le rendu est de haute qualité sans avoir à réimporter la BDD.
 */
export function mapPhotoUrl(url) {
  if (!url) return null;
  if (url.includes("photo-1539650116574")) {
    return "https://res.cloudinary.com/mgmnml6e/image/upload/v1783959393/j5jlng36f4zyt1vswgou.jpg";
  }
  if (url.includes("photo-1506929562872")) {
    return "https://res.cloudinary.com/mgmnml6e/image/upload/v1783959416/okulb7fkvy7e8zicav96.jpg";
  }
  if (url.includes("photo-1618773928121")) {
    return "https://res.cloudinary.com/mgmnml6e/image/upload/v1783959443/ovth8kcv4z1xzoqj1z9o.jpg";
  }
  return url;
}
