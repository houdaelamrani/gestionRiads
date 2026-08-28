package com.pfa.riad.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckInRequest {

    @NotBlank(message = "Le nom du client est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom du client est obligatoire")
    private String prenom;

    private String email;
    private String telephone;

    @NotBlank(message = "Le type de pièce d'identité est obligatoire (CIN, PASSEPORT, CARTE_SEJOUR)")
    private String typePieceIdentite;

    @NotBlank(message = "Le numéro de la pièce d'identité est obligatoire")
    private String numeroPieceIdentite;

    private String nationalite;
    private LocalDate dateNaissance;

    private Integer nombrePersonnes;
    private String remarques;

    // Encaissement sur place
    private Boolean paiementEffectueSurPlace;
    private String methodePaiementSurPlace; // ESPECES, CARTE_BANCAIRE, VIREMENT
}
