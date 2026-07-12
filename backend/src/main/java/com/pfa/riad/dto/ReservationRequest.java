package com.pfa.riad.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequest {

    @NotNull(message = "L'identifiant du Riad est obligatoire")
    private UUID riadId;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate dateFin;

    // Liste des chambres choisies par le client
    private List<UUID> chambreIds;

    // Vrai si le client réserve le Riad en entier
    private Boolean riadEntier = false;

    // Méthode de paiement (ex: CARTE_BANCAIRE, PAYPAL, SUR_PLACE)
    @NotNull(message = "La méthode de paiement est obligatoire")
    private String methodePaiement;
}
