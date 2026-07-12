package com.pfa.riad.dto;

import com.pfa.riad.enums.TypeChambre;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChambreRequest {

    @NotBlank(message = "Le nom ou numéro de la chambre est obligatoire")
    private String nomChambre;

    @NotNull(message = "Le type de chambre est obligatoire")
    private TypeChambre typeChambre;

    private String description;

    @NotNull(message = "Le prix par nuit est obligatoire")
    @Min(value = 1, message = "Le prix par nuit doit être strictement positif")
    private BigDecimal prixParNuit;

    @NotNull(message = "La capacité est obligatoire")
    @Min(value = 1, message = "La capacité doit être d'au moins 1 personne")
    private Integer capacite;
}
