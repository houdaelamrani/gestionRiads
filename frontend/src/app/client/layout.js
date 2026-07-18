"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../lib/LanguageContext";
import { getNotifications, markNotificationsAsRead, getUnreadCount } from "../../lib/NotificationSystem";

export default function ClientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // États pour notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "CLIENT") {
      router.push("/");
      return;
    }
    setCurrentUser(user);
    setLoading(false);
  }, [router]);

  // Synchronisation des notifications
  useEffect(() => {
    const updateNotifs = () => {
      setNotifications(getNotifications());
      setUnreadCount(getUnreadCount());
    };
    updateNotifs();
    window.addEventListener("notifications_updated", updateNotifs);
    return () => window.removeEventListener("notifications_updated", updateNotifs);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>{t("loading_space")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <nav className="navbar" style={{ position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" className="nav-logo">
          Morocco<span>Riads</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/client/catalogue"
            className={`btn ${pathname === "/client/catalogue" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 18px", fontSize: "0.85rem" }}
          >
            {t("nav_catalogue")}
          </Link>
          <Link
            href="/client/reservations"
            className={`btn ${pathname === "/client/reservations" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 18px", fontSize: "0.85rem" }}
          >
            {t("nav_reservations")}
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          
          {/* Cloche de notifications */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markNotificationsAsRead();
              }}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.25rem",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                color: "var(--text-secondary)"
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{
                position: "absolute",
                top: "35px",
                right: "0",
                width: "290px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                border: "1px solid var(--border)",
                zIndex: 1000,
                maxHeight: "320px",
                overflowY: "auto",
                padding: "10px 0"
              }}>
                <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                  {language === "en" ? "Notifications" : "Notifications"}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                    {language === "en" ? "No new notifications" : "Aucune notification"}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--gray-light)",
                      fontSize: "0.8rem",
                      lineHeight: "1.4",
                      backgroundColor: n.read ? "transparent" : "#f0f9ff",
                      color: "var(--text-primary)"
                    }}>
                      {n.message}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Lang Selector */}
          <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px", backgroundColor: "var(--bg-secondary)" }}>
            <button
              onClick={() => setLanguage("fr")}
              style={{
                background: language === "fr" ? "var(--terracotta)" : "transparent",
                color: language === "fr" ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "18px",
                padding: "4px 8px",
                fontSize: "0.7rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage("en")}
              style={{
                background: language === "en" ? "var(--terracotta)" : "transparent",
                color: language === "en" ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "18px",
                padding: "4px 8px",
                fontSize: "0.7rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              EN
            </button>
          </div>

          <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            👤 <strong style={{ color: "var(--terracotta)" }}>{currentUser?.prenom}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ padding: "7px 14px", fontSize: "0.82rem", border: "1px solid var(--border)" }}
          >
            {t("logout")}
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}


