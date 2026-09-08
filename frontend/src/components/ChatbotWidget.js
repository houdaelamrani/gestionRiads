"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function ChatbotWidget() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: `Bonjour ! Je suis **Houda**, votre Concierge & Conceptrice de Voyage IA. Je suis ici pour vous organiser votre séjour sur mesure avec le devis en 1 clic ! 🏰✨

🏙️ **Villes disponibles pour la réservation :**
• 🌴 **Marrakech** : Palais majestueux, médina vibrante et ambiance impériale.
• 🕌 **Fès** : Capitale spirituelle, ruelles médiévales et tanneries historiques.
• 🌊 **Essaouira** : Douceur océane, remparts de la Sqala et brise marine.

Sélectionnez une ville ci-dessous ou posez-moi n'importe quelle question :`,
      suggestions: [
        "📍 Marrakech",
        "📍 Fès",
        "📍 Essaouira",
        "🌴 Circuit combiné Marrakech + Essaouira (4 jours)",
        "💆 Riads avec Spa & Hammam",
      ],
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll au dernier message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-bahia-chat", handleOpen);
    window.addEventListener("open-houda-chat", handleOpen);
    return () => {
      window.removeEventListener("open-bahia-chat", handleOpen);
      window.removeEventListener("open-houda-chat", handleOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsgId = Date.now().toString();
    const newUserMsg = { id: userMsgId, sender: "user", text };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4),
        }),
      });

      if (!res.ok) throw new Error("Erreur de communication avec l'assistant");

      const data = await res.json();
      const botMsgId = (Date.now() + 1).toString();

      const newBotMsg = {
        id: botMsgId,
        sender: "bot",
        text: data.reply || "Voici ce que j'ai trouvé pour votre séjour :",
        tripPlan: data.tripPlan || null,
        riads: data.riads || null,
        suggestions: data.suggestions || [],
      };

      setMessages((prev) => [...prev, newBotMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Désolée, une petite interruption est survenue. Veuillez réessayer votre question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "bot",
        text: `Bonjour ! Je suis **Houda**, votre Concierge & Conceptrice de Voyage IA. Je suis ici pour vous organiser votre séjour sur mesure avec le devis en 1 clic ! 🏰✨

🏙️ **Villes disponibles pour la réservation :**
• 🌴 **Marrakech**
• 🕌 **Fès**
• 🌊 **Essaouira**

Sélectionnez votre destination ou posez-moi votre question :`,
        suggestions: [
          "📍 Marrakech",
          "📍 Fès",
          "📍 Essaouira",
          "🌴 Circuit combiné Marrakech + Essaouira (4 jours)",
          "💆 Riads avec Spa & Hammam",
        ],
      },
    ]);
  };

  // Formattage markdown soigné (gras, listes)
  const renderFormattedText = (txt) => {
    if (!txt) return null;
    const parts = txt.split("\n").map((line, lIdx) => {
      const isBullet = line.trim().startsWith("• ") || line.trim().startsWith("- ");
      const rawContent = isBullet ? line.trim().substring(2) : line;

      // Remplacer **texte** par <strong>
      const boldFormatted = rawContent.split(/(\*\*.*?\*\*)/g).map((chunk, cIdx) => {
        if (chunk.startsWith("**") && chunk.endsWith("**")) {
          return <strong key={cIdx} style={{ color: "#1e293b" }}>{chunk.slice(2, -2)}</strong>;
        }
        return chunk;
      });

      if (isBullet) {
        return (
          <div key={lIdx} style={{ display: "flex", gap: "6px", margin: "3px 0 3px 6px" }}>
            <span style={{ color: "#c85a32", fontWeight: "bold" }}>•</span>
            <span>{boldFormatted}</span>
          </div>
        );
      }
      return (
        <div key={lIdx} style={{ margin: line.trim() === "" ? "6px 0" : "2px 0" }}>
          {boldFormatted}
        </div>
      );
    });
    return parts;
  };

  return (
    <>
      {/* 1. Bouton Flottant Déclencheur (Bas Droite) */}
      {!isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999999,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          {/* Badge Tooltip d'invitation */}
          <div
            onClick={() => setIsOpen(true)}
            style={{
              backgroundColor: "#ffffff",
              color: "#1e293b",
              padding: "7px 14px",
              borderRadius: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              fontSize: "0.82rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              border: "1px solid #fed7aa",
              animation: "bounceTooltip 3s infinite",
            }}
          >
            <span style={{ fontSize: "1rem" }}>✨</span>
            <span>Besoin d'un séjour sur mesure ? <strong>Demandez à Houda IA</strong></span>
          </div>

          {/* Bouton Rond Flottant */}
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Ouvrir le Chatbot Houda Concierge IA"
            style={{
              width: "62px",
              height: "62px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c85a32 0%, #1e3a8a 100%)",
              border: "3px solid #ffffff",
              boxShadow: "0 10px 25px rgba(200, 90, 50, 0.45)",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              <circle cx="12" cy="11" r="1" fill="currentColor" />
              <circle cx="8" cy="11" r="1" fill="currentColor" />
              <circle cx="16" cy="11" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}

      {/* 2. Fenêtre de Discussion Interactive */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "420px",
            maxWidth: "calc(100vw - 32px)",
            height: "650px",
            maxHeight: "calc(100vh - 48px)",
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(200, 90, 50, 0.15)",
            display: "flex",
            flexDirection: "column",
            zIndex: 10000,
            overflow: "hidden",
            fontFamily: "inherit",
            animation: "slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header Élégant */}
          <div
            style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, #c85a32 0%, #1e3a8a 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Avatar Houda avec pulsation verte */}
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#fed7aa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#c85a32",
                    fontWeight: 800,
                    fontSize: "1.2rem",
                    border: "2px solid #ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  👩‍💼
                </div>
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#22c55e",
                    border: "2px solid #ffffff",
                    borderRadius: "50%",
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Houda</h3>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      backgroundColor: "rgba(255,255,255,0.25)",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                    }}
                  >
                    CONCIERGE IA
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.78rem", opacity: 0.9 }}>
                  Conceptrice de Voyage & Réservation
                </p>
              </div>
            </div>

            {/* Boutons Action Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={resetConversation}
                title="Recommencer la conversation"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Fermer"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Zone des Messages (Scrollable) */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              backgroundColor: "#faf8f5",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                  gap: "8px",
                }}
              >
                {/* Bulle Texte */}
                <div
                  style={{
                    maxWidth: "92%",
                    padding: "12px 16px",
                    borderRadius: msg.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    backgroundColor: msg.sender === "user" ? "#c85a32" : "#ffffff",
                    color: msg.sender === "user" ? "#ffffff" : "#334155",
                    fontSize: "0.89rem",
                    lineHeight: "1.45",
                    boxShadow: msg.sender === "user" ? "0 4px 12px rgba(200,90,50,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
                    border: msg.sender === "user" ? "none" : "1px solid #f1ece4",
                  }}
                >
                  {renderFormattedText(msg.text)}
                </div>

                {/* CARTE D'ITINÉRAIRE MULTI-VILLES (Circuit IA) */}
                {msg.tripPlan && (
                  <div
                    style={{
                      width: "100%",
                      backgroundColor: "#ffffff",
                      borderRadius: "16px",
                      padding: "16px",
                      border: "2px solid #fed7aa",
                      boxShadow: "0 8px 20px rgba(200, 90, 50, 0.12)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {/* Header Circuit */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
                      <div>
                        <span style={{ fontSize: "0.72rem", color: "#c85a32", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          ✦ Circuit Personnalisé
                        </span>
                        <h4 style={{ margin: "2px 0 0 0", fontSize: "0.98rem", color: "#1e293b", fontWeight: 700 }}>
                          {msg.tripPlan.title}
                        </h4>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          ⏱️ {msg.tripPlan.duration}
                        </span>
                      </div>
                      <div style={{ textAlign: "right", backgroundColor: "#fff7ed", padding: "6px 10px", borderRadius: "10px", border: "1px solid #ffedd5" }}>
                        <span style={{ fontSize: "0.68rem", color: "#9a3412", fontWeight: 600, display: "block" }}>Budget Total</span>
                        <span style={{ fontSize: "0.95rem", color: "#c85a32", fontWeight: 800 }}>{msg.tripPlan.totalPrice}</span>
                      </div>
                    </div>

                    {/* Étapes du Circuit */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {msg.tripPlan.stages?.map((stg) => (
                        <div
                          key={stg.step}
                          style={{
                            display: "flex",
                            gap: "10px",
                            backgroundColor: "#fdfbf7",
                            padding: "10px",
                            borderRadius: "12px",
                            border: "1px solid #f1ece4",
                          }}
                        >
                          <img
                            src={stg.riad.photoUrl}
                            alt={stg.riad.nom}
                            style={{
                              width: "70px",
                              height: "70px",
                              borderRadius: "8px",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#1e3a8a" }}>
                                  Étape {stg.step} • {stg.city} ({stg.days})
                                </span>
                              </div>
                              <h5 style={{ margin: "1px 0", fontSize: "0.88rem", fontWeight: 700, color: "#1e293b" }}>
                                {stg.riad.nom}
                              </h5>
                              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", lineHeight: "1.3" }}>
                                {stg.program}
                              </p>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                              <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 700 }}>
                                ✓ {stg.highlight}
                              </span>
                              <Link
                                href={`/client/riads/${stg.riad.id}`}
                                onClick={() => setIsOpen(false)}
                                style={{
                                  fontSize: "0.75rem",
                                  backgroundColor: "#c85a32",
                                  color: "#ffffff",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  textDecoration: "none",
                                  fontWeight: 600,
                                }}
                              >
                                Réserver l'étape →
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cadeau Hospitalité */}
                    {msg.tripPlan.perk && (
                      <div
                        style={{
                          backgroundColor: "#f0fdf4",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontSize: "0.76rem",
                          color: "#15803d",
                          fontWeight: 600,
                          border: "1px dashed #86efac",
                        }}
                      >
                        {msg.tripPlan.perk}
                      </div>
                    )}
                  </div>
                )}

                {/* CARTES DE RIADS ET LEURS CHAMBRES DISPONIBLES */}
                {msg.riads && msg.riads.length > 0 && (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {msg.riads.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          backgroundColor: "#ffffff",
                          borderRadius: "14px",
                          padding: "10px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", gap: "10px" }}>
                          <img
                            src={r.photoUrl}
                            alt={r.nom}
                            style={{ width: "75px", height: "75px", borderRadius: "10px", objectFit: "cover" }}
                          />
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b" }}>{r.nom}</span>
                                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#c85a32" }}>
                                  {r.prixRiadEntier ? `${Number(r.prixRiadEntier).toLocaleString("fr-FR")} MAD` : "Consulter"}
                                </span>
                              </div>
                              <span style={{ fontSize: "0.74rem", color: "#64748b" }}>📍 {r.ville}, Maroc</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                              <div style={{ display: "flex", gap: "4px" }}>
                                {r.hasSpa && <span style={{ fontSize: "0.68rem", background: "#f3e8ff", color: "#7c3aed", padding: "1px 5px", borderRadius: "4px", fontWeight: 600 }}>Spa</span>}
                                {r.hasHammam && <span style={{ fontSize: "0.68rem", background: "#e0f2fe", color: "#0284c7", padding: "1px 5px", borderRadius: "4px", fontWeight: 600 }}>Hammam</span>}
                                {r.hasTraiteur && <span style={{ fontSize: "0.68rem", background: "#fef3c7", color: "#d97706", padding: "1px 5px", borderRadius: "4px", fontWeight: 600 }}>Traiteur</span>}
                              </div>
                              <Link
                                href={`/client/riads/${r.id}`}
                                onClick={() => setIsOpen(false)}
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#ffffff",
                                  backgroundColor: "#1e3a8a",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  textDecoration: "none",
                                  fontWeight: 600,
                                }}
                              >
                                Voir & Réserver →
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* Liste détaillée des chambres disponibles */}
                        {r.chambres && r.chambres.length > 0 && (
                          <div style={{ backgroundColor: "#fdfbf7", padding: "8px 10px", borderRadius: "8px", border: "1px solid #f1ece4" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9a3412", textTransform: "uppercase", letterSpacing: "0.3px", display: "block", marginBottom: "4px" }}>
                              🛏️ Chambres & Suites disponibles :
                            </span>
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              {r.chambres.map((c, cIdx) => (
                                <div key={cIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem", color: "#334155" }}>
                                  <span>• <strong>{c.nomChambre}</strong> ({c.typeChambre || "Chambre"})</span>
                                  <span style={{ color: "#c85a32", fontWeight: 700 }}>{Number(c.prixParNuit).toLocaleString("fr-FR")} MAD / nuit</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions Rapides (Chips cliquables) */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendMessage(sug)}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #fed7aa",
                          borderRadius: "14px",
                          padding: "5px 10px",
                          fontSize: "0.76rem",
                          color: "#c85a32",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#fff7ed";
                          e.currentTarget.style.borderColor = "#c85a32";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                          e.currentTarget.style.borderColor = "#fed7aa";
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Animation de chargement */}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "#ffffff", borderRadius: "16px", alignSelf: "flex-start", border: "1px solid #f1ece4" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Houda prépare votre réponse</span>
                <span style={{ display: "inline-flex", gap: "3px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#c85a32", animation: "pulseDot 1s infinite" }}></span>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#c85a32", animation: "pulseDot 1s 0.2s infinite" }}></span>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#c85a32", animation: "pulseDot 1s 0.4s infinite" }}></span>
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Formulaire de Saisie Message */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: "12px 16px",
              backgroundColor: "#ffffff",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Posez une question ou choisissez une ville..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "20px",
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                outline: "none",
                backgroundColor: "#f8fafc",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#c85a32")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: inputMessage.trim() && !loading ? "#c85a32" : "#e2e8f0",
                color: "#ffffff",
                border: "none",
                cursor: inputMessage.trim() && !loading ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
