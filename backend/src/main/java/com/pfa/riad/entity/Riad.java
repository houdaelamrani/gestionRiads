package com.pfa.riad.entity;

import com.pfa.riad.enums.StatutValidation;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "riads")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Riad {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Le nom du riad est obligatoire")
    @Column(nullable = false, length = 150)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank(message = "L'adresse du riad est obligatoire")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String adresse;

    @NotBlank(message = "La ville du riad est obligatoire")
    @Column(nullable = false, length = 100)
    private String ville;

    @NotNull(message = "Le propriétaire du riad doit être spécifié")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "proprietaire_id", nullable = false)
    private Utilisateur proprietaire;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_validation", nullable = false, length = 20)
    private StatutValidation statutValidation = StatutValidation.EN_ATTENTE;

    @Column(name = "prix_riad_entier", precision = 10, scale = 2)
    private BigDecimal prixRiadEntier;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;
}
