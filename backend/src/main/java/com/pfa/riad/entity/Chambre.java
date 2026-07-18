package com.pfa.riad.entity;

import com.pfa.riad.enums.TypeChambre;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "chambres")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chambre {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Le riad associé est obligatoire")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "riad_id", nullable = false)
    @JsonIgnore
    private Riad riad;

    @NotBlank(message = "Le nom ou numéro de la chambre est obligatoire")
    @Column(name = "nom_chambre", nullable = false, length = 100)
    private String nomChambre;

    @NotNull(message = "Le type de chambre est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "type_chambre", nullable = false, length = 50)
    private TypeChambre typeChambre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Le prix par nuit est obligatoire")
    @Min(value = 1, message = "Le prix par nuit doit être strictement positif")
    @Column(name = "prix_par_nuit", nullable = false, precision = 10, scale = 2)
    private BigDecimal prixParNuit;

    @NotNull(message = "La capacité est obligatoire")
    @Min(value = 1, message = "La capacité doit être d'au moins 1 personne")
    @Column(nullable = false)
    private Integer capacite;

    @Column(nullable = false)
    private Boolean disponible = true;
}
