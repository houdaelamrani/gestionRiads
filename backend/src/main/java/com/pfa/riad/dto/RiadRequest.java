package com.pfa.riad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiadRequest {

    @NotBlank(message = "Le nom du riad est obligatoire")
    @Size(min = 3, max = 150, message = "Le nom du riad doit contenir entre 3 et 150 caractères")
    private String nom;

    private String description;

    @NotBlank(message = "L'adresse du riad est obligatoire")
    private String adresse;

    @NotBlank(message = "La ville est obligatoire")
    private String ville;

    private BigDecimal prixRiadEntier; // Optionnel
}
