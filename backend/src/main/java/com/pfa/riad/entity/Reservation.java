package com.pfa.riad.entity;

import com.pfa.riad.enums.StatutReservation;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "reservations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "chambres")
@ToString(exclude = "chambres")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_id")
    private Utilisateur client;

    @NotNull(message = "Le riad associé est obligatoire")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "riad_id", nullable = false)
    private Riad riad;

    @NotNull(message = "La date de début est obligatoire")
    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @NotNull(message = "Le prix total est obligatoire")
    @Column(name = "prix_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal prixTotal;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutReservation statut = StatutReservation.EN_ATTENTE;

    @Column(name = "riad_entier")
    private Boolean riadEntier = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "reservation_chambres",
        joinColumns = @JoinColumn(name = "reservation_id"),
        inverseJoinColumns = @JoinColumn(name = "chambre_id")
    )
    @Builder.Default
    private Set<Chambre> chambres = new HashSet<>();

    @Column(name = "check_in_effectue")
    @Builder.Default
    private Boolean checkInEffectue = false;

    @Column(name = "date_heure_check_in")
    private LocalDateTime dateHeureCheckIn;

    @Column(name = "client_nom")
    private String clientNom;

    @Column(name = "client_prenom")
    private String clientPrenom;

    @Column(name = "client_email")
    private String clientEmail;

    @Column(name = "client_telephone")
    private String clientTelephone;

    @Column(name = "client_type_piece_identite")
    private String clientTypePieceIdentite; // CIN, PASSEPORT, CARTE_SEJOUR

    @Column(name = "client_numero_piece_identite")
    private String clientNumeroPieceIdentite;

    @Column(name = "client_nationalite")
    private String clientNationalite;

    @Column(name = "client_date_naissance")
    private LocalDate clientDateNaissance;

    @Column(name = "nombre_personnes")
    private Integer nombrePersonnes;

    @Column(name = "remarques_check_in", columnDefinition = "TEXT")
    private String remarquesCheckIn;

    @Column(name = "methode_paiement_check_in")
    private String methodePaiementCheckIn;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;
}
