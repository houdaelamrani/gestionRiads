package com.pfa.riad.repository;

import com.pfa.riad.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    // Trouver toutes les réservations d'un client spécifique (triées par date de création récente)
    List<Reservation> findByClientIdOrderByDateCreationDesc(UUID clientId);

    // Trouver toutes les réservations pour les Riads appartenant à un hébergeur/propriétaire
    List<Reservation> findByRiadProprietaireIdOrderByDateCreationDesc(UUID ownerId);

    // Trouver toutes les réservations d'un Riad
    List<Reservation> findByRiadIdOrderByDateCreationDesc(UUID riadId);
}
