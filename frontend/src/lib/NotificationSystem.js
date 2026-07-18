"use client";

// Fonction utilitaire pour récupérer les notifications du localStorage
export function getNotifications() {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("notifications");
  return stored ? JSON.parse(stored) : [];
}

// Fonction pour ajouter une notification
export function addNotification(message, type = "info") {
  if (typeof window === "undefined") return;
  const notifications = getNotifications();
  
  const newNotif = {
    id: Math.random().toString(36).substring(2, 9),
    message,
    type, // 'info', 'success', 'reminder'
    timestamp: new Date().toISOString(),
    read: false
  };
  
  notifications.unshift(newNotif); // Ajouter au début
  localStorage.setItem("notifications", JSON.stringify(notifications));
  
  // Déclencher un événement global pour avertir les composants (comme la cloche)
  window.dispatchEvent(new Event("notifications_updated"));
}

// Fonction pour marquer toutes les notifications comme lues
export function markNotificationsAsRead() {
  if (typeof window === "undefined") return;
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem("notifications", JSON.stringify(updated));
  window.dispatchEvent(new Event("notifications_updated"));
}

// Récupérer le nombre de notifications non lues
export function getUnreadCount() {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
}
