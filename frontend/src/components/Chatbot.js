"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../lib/LanguageContext";

const formatMessageText = (text) => {
  if (!text) return "";
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => {
    const parts = line.split(/\*\*([^*]+)\*\*/g);
    const content = parts.map((part, partIndex) => {
      if (partIndex % 2 === 1) {
        return <strong key={partIndex} style={{ color: "inherit" }}>{part}</strong>;
      }
      return part;
    });
    return (
      <span key={lineIndex}>
        {content}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};

export default function Chatbot() {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Initialisation du premier message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        text: language === "en" 
          ? "Hello! I am Yasmine, your virtual concierge. How can I help you book or plan your dream stay in Morocco today?" 
          : "Bonjour ! Je suis Yasmine, votre concierge virtuelle. Comment puis-je vous aider à planifier ou réserver votre séjour de rêve au Maroc ?",
        sender: "bot"
      }
    ]);
  }, [language]);

  // Défilement automatique vers le bas lors de l'arrivée de messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Ajouter le message de l'utilisateur
    const userMsg = { id: Math.random().toString(), text, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      
      const data = await response.json();
      
      // Simuler un léger délai d'écriture pour le réalisme
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Math.random().toString(), text: data.response, sender: "bot" }
        ]);
        setIsTyping(false);
      }, 800);

    } catch (error) {
      console.error("Erreur chatbot:", error);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            id: Math.random().toString(), 
            text: language === "en" 
              ? "I'm having trouble connecting to the server. But you can book rooms, cancel bookings or leave reviews directly in your client dashboard!" 
              : "J'ai du mal à contacter le serveur. Sachez que vous pouvez réserver vos chambres, annuler des séjours ou laisser des avis directement sur votre espace client !", 
            sender: "bot" 
          }
        ]);
        setIsTyping(false);
      }, 800);
    }
  };

  const handleQuickReply = (text, displayLabel) => {
    handleSendMessage(text);
  };

  const quickReplies = language === "en" 
    ? [
        { label: "💰 Rates & Pricing", text: "How much is a room?" },
        { label: "🧖‍♀️ Spa & Hammam", text: "Do you have a Spa?" },
        { label: "❌ Cancellation Policy", text: "How to cancel a reservation?" },
        { label: "🍽️ Gastronomy", text: "What food is served?" }
      ]
    : [
        { label: "💰 Tarifs", text: "Quels sont les tarifs ?" },
        { label: "🧖‍♀️ Spa & Hammam", text: "Avez-vous un Spa et Hammam ?" },
        { label: "❌ Annulation", text: "Comment annuler une réservation ?" },
        { label: "🍽️ Gastronomie", text: "Quel repas proposez-vous ?" }
      ];

  return (
    <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 9999, fontFamily: "inherit" }}>
      
      {/* 1. Bouton Bulle de Chat */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "var(--terracotta)",
          border: "none",
          boxShadow: "0 4px 15px rgba(224, 122, 95, 0.4)",
          color: "white",
          fontSize: "1.6rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.3s ease, background-color 0.2s",
          transform: isOpen ? "rotate(90deg)" : "scale(1)"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = isOpen ? "rotate(90deg) scale(1.05)" : "scale(1.08)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = isOpen ? "rotate(90deg)" : "scale(1)"}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* 2. Fenêtre de Chat */}
      {isOpen && (
        <div style={{
          position: "absolute",
          bottom: "75px",
          right: "0",
          width: "360px",
          height: "480px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "fadeInUp 0.3s ease"
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, var(--terracotta), #c85a3c)",
            color: "white",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "1px solid rgba(0,0,0,0.05)"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
              position: "relative"
            }}>
              👩‍💼
              <span style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                border: "2px solid #ffffff"
              }} />
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "0.95rem" }}>Yasmine</strong>
              <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>Concierge Virtuelle IA</span>
            </div>
          </div>

          {/* Corps de Chat (Messages) */}
          <div style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "#f8fafc"
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  backgroundColor: msg.sender === "user" ? "var(--terracotta)" : "#ffffff",
                  color: msg.sender === "user" ? "white" : "var(--text-primary)",
                  padding: "10px 14px",
                  borderRadius: msg.sender === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  boxShadow: msg.sender === "user" ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
                  fontSize: "0.88rem",
                  lineHeight: "1.4"
                }}
              >
                {formatMessageText(msg.text)}
              </div>
            ))}
            
            {/* Indicateur d'écriture */}
            {isTyping && (
              <div style={{
                alignSelf: "flex-start",
                backgroundColor: "#ffffff",
                padding: "10px 16px",
                borderRadius: "16px 16px 16px 2px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex",
                gap: "4px",
                alignItems: "center"
              }}>
                <span style={{ animation: "bounce 1.4s infinite ease-in-out", width: "6px", height: "6px", backgroundColor: "#94a3b8", borderRadius: "50%", display: "inline-block" }}></span>
                <span style={{ animation: "bounce 1.4s infinite ease-in-out 0.2s", width: "6px", height: "6px", backgroundColor: "#94a3b8", borderRadius: "50%", display: "inline-block" }}></span>
                <span style={{ animation: "bounce 1.4s infinite ease-in-out 0.4s", width: "6px", height: "6px", backgroundColor: "#94a3b8", borderRadius: "50%", display: "inline-block" }}></span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies (Suggestions rapides) */}
          <div style={{
            padding: "8px 12px",
            backgroundColor: "#f1f5f9",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            scrollbarWidth: "none"
          }}>
            {quickReplies.map((qr) => (
              <button
                key={qr.label}
                onClick={() => handleQuickReply(qr.text, qr.label)}
                style={{
                  flexShrink: 0,
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "all 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--terracotta)";
                  e.currentTarget.style.color = "var(--terracotta)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {qr.label}
              </button>
            ))}
          </div>

          {/* Formulaire d'envoi */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              display: "flex",
              borderTop: "1px solid var(--border)",
              padding: "10px"
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={language === "en" ? "Ask Yasmine a question..." : "Posez une question à Yasmine..."}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "8px 12px",
                fontSize: "0.88rem"
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "var(--terracotta)",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "0 12px"
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
      
      {/* Styles animés en ligne pour simplifier */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}
