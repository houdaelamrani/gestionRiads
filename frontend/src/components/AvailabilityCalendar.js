"use client";

import { useState, useMemo } from "react";

/**
 * Composant Calendrier des disponibilités épuré & professionnel
 * Les jours occupés, réservés et passés sont désactivés avec élégance.
 */
export default function AvailabilityCalendar({
  planningDates = [],
  selectedRoomId = null,
  isRiadEntier = false,
  startDate = "",
  endDate = "",
  onSelectDates = null,
  interactive = true,
  language = "fr",
  compact = false,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [hoverDate, setHoverDate] = useState(null);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNamesFr = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNamesFr = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const dayNamesEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const currentMonthName = language === "en" ? monthNamesEn[month] : monthNamesFr[month];
  const dayNames = language === "en" ? dayNamesEn : dayNamesFr;

  // Filtrer les réservations pour la chambre ou le Riad Entier
  const relevantBookings = useMemo(() => {
    if (!planningDates || !Array.isArray(planningDates)) return [];
    return planningDates.filter((p) => {
      if (isRiadEntier) return true;
      if (selectedRoomId) return p.chambreId === selectedRoomId || p.riadEntier === true;
      return true;
    });
  }, [planningDates, selectedRoomId, isRiadEntier]);

  // Carte indexée des dates occupées / réservées
  const dateStatusMap = useMemo(() => {
    const map = {};
    relevantBookings.forEach((b) => {
      if (!b.dateDebut || !b.dateFin) return;
      const dStart = new Date(b.dateDebut);
      const dEnd = new Date(b.dateFin);
      if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) return;

      const cur = new Date(dStart);
      while (cur <= dEnd) {
        const dStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        map[dStr] = true;
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [relevantBookings]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Grille des jours
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push({ empty: true, key: `empty-prev-${i}` });
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isUnavailable = Boolean(dateStatusMap[dateStr]);
      const isDisabled = isPast || isUnavailable;

      const isSelectedStart = startDate === dateStr && !isDisabled;
      const isSelectedEnd = endDate === dateStr && !isDisabled;
      const isInRange = Boolean(
        startDate &&
        endDate &&
        dateStr >= startDate &&
        dateStr <= endDate &&
        !isDisabled
      );
      const isHoverRange = Boolean(
        interactive &&
        startDate &&
        !endDate &&
        hoverDate &&
        dateStr >= startDate &&
        dateStr <= hoverDate &&
        hoverDate > startDate &&
        !isDisabled
      );

      days.push({
        empty: false,
        dayNum,
        dateStr,
        isPast,
        isToday,
        isUnavailable,
        isDisabled,
        isSelectedStart,
        isSelectedEnd,
        isInRange,
        isHoverRange,
        key: `day-${dateStr}`,
      });
    }

    return days;
  }, [year, month, todayStr, dateStatusMap, startDate, endDate, hoverDate, interactive]);

  // Clic sur un jour
  const handleDayClick = (day) => {
    if (!interactive || !onSelectDates || day.isDisabled) return;

    if (!startDate || (startDate && endDate)) {
      onSelectDates({ dateDebut: day.dateStr, dateFin: "" });
      return;
    }

    if (startDate && !endDate && day.dateStr <= startDate) {
      onSelectDates({ dateDebut: day.dateStr, dateFin: "" });
      return;
    }

    if (startDate && !endDate && day.dateStr > startDate) {
      const cur = new Date(startDate);
      const target = new Date(day.dateStr);
      let hasConflict = false;

      while (cur <= target) {
        const dStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        if (dateStatusMap[dStr]) {
          hasConflict = true;
          break;
        }
        cur.setDate(cur.getDate() + 1);
      }

      if (hasConflict) {
        onSelectDates({ dateDebut: day.dateStr, dateFin: "" });
        return;
      }

      onSelectDates({ dateDebut: startDate, dateFin: day.dateStr });
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        padding: compact ? "14px" : "20px",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* En-tête mois & navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: compact ? "1rem" : "1.12rem",
            fontWeight: 700,
            color: "#0f172a",
            margin: 0,
            fontFamily: "'Playfair Display', serif",
          }}
        >
          {currentMonthName} {year}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#334155",
              transition: "background-color 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#334155",
              transition: "background-color 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div style={{ marginBottom: "12px" }}>
        {/* Jours de la semaine */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
            marginBottom: "6px",
            textAlign: "center",
          }}
        >
          {dayNames.map((dName, idx) => (
            <div
              key={idx}
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "4px 0",
              }}
            >
              {dName}
            </div>
          ))}
        </div>

        {/* Cellules des jours */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
          }}
        >
          {calendarDays.map((day) => {
            if (day.empty) {
              return (
                <div
                  key={day.key}
                  style={{
                    height: compact ? "36px" : "40px",
                    backgroundColor: "transparent",
                  }}
                />
              );
            }

            // Styles selon disponibilité
            let bg = "#ffffff";
            let textColor = "#1e293b";
            let borderColor = "#f1f5f9";
            let cursor = interactive ? "pointer" : "default";
            let opacity = 1;
            let textDecoration = "none";

            if (day.isDisabled) {
              bg = "#f8fafc";
              textColor = "#cbd5e1";
              borderColor = "#f1f5f9";
              cursor = "not-allowed";
              opacity = 0.65;
              textDecoration = day.isPast ? "line-through" : "none";
            }

            // Sélection active
            if (day.isSelectedStart || day.isSelectedEnd) {
              bg = "var(--terracotta, #d96b43)";
              textColor = "#ffffff";
              borderColor = "var(--terracotta, #d96b43)";
              opacity = 1;
            } else if (day.isInRange || day.isHoverRange) {
              bg = "rgba(217, 107, 67, 0.12)";
              borderColor = "rgba(217, 107, 67, 0.25)";
              textColor = "var(--terracotta, #d96b43)";
            }

            return (
              <button
                type="button"
                key={day.key}
                disabled={day.isDisabled && !interactive}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => !day.isDisabled && setHoverDate(day.dateStr)}
                onMouseLeave={() => setHoverDate(null)}
                style={{
                  height: compact ? "36px" : "40px",
                  borderRadius: "8px",
                  border: `1px solid ${borderColor}`,
                  backgroundColor: bg,
                  color: textColor,
                  cursor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  transition: "all 0.15s ease",
                  opacity,
                  textDecoration,
                  fontSize: "0.88rem",
                  fontWeight: day.isSelectedStart || day.isSelectedEnd ? 700 : day.isToday ? 700 : 500,
                  outline: day.isToday && !day.isSelectedStart && !day.isSelectedEnd ? "1.5px solid #cbd5e1" : "none",
                }}
              >
                {day.dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Résumé de sélection discret */}
      {interactive && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "12px",
            borderTop: "1px solid #f1f5f9",
            fontSize: "0.82rem",
            color: "#64748b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{language === "en" ? "Check-in:" : "Arrivée :"}</span>
            <strong style={{ color: startDate ? "#0f172a" : "#94a3b8" }}>
              {startDate || "—"}
            </strong>
            <span style={{ color: "#cbd5e1" }}>·</span>
            <span>{language === "en" ? "Check-out:" : "Départ :"}</span>
            <strong style={{ color: endDate ? "#0f172a" : "#94a3b8" }}>
              {endDate || "—"}
            </strong>
          </div>

          {startDate && endDate && (
            <button
              type="button"
              onClick={() => onSelectDates && onSelectDates({ dateDebut: "", dateFin: "" })}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "0.78rem",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              {language === "en" ? "Clear" : "Effacer"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
