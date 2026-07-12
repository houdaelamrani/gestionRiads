package com.pfa.riad.entity;

import com.pfa.riad.enums.MethodePaiement;
import com.pfa.riad.enums.StatutPaiement;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "paiements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "La réservation associée est obligatoire")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @NotNull(message = "Le montant est obligatoire")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal montant;

    @CreationTimestamp
    @Column(name = "date_paiement", updatable = false)
    private LocalDateTime datePaiement;

    @NotNull(message = "La méthode de paiement est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "methode_paiement", nullable = false, length = 50)
    private MethodePaiement methodePaiement;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_paiement", nullable = false, length = 20)
    private StatutPaiement statutPaiement = StatutPaiement.EN_ATTENTE;
}
