package com.pfa.riad.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanningDateDto {
    private UUID reservationId;
    private UUID chambreId;
    private String nomChambre;
    private Boolean riadEntier;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String statut; // "RESERVE" (EN_ATTENTE) ou "OCCUPE" (CONFIRMEE)
    private String statutReservation; // "EN_ATTENTE" ou "CONFIRMEE"
}
