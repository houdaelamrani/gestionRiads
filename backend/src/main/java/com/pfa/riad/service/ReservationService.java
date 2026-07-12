package com.pfa.riad.service;

import com.pfa.riad.dto.ReservationRequest;
import com.pfa.riad.entity.Reservation;

import java.util.List;
import java.util.UUID;

public interface ReservationService {

    // Créer une nouvelle réservation pour un client
    Reservation creerReservation(ReservationRequest request, UUID clientId);

    // Lister toutes les réservations d'un client
    List<Reservation> obtenirReservationsClient(UUID clientId);

    // Lister toutes les réservations reçues par un propriétaire (pour ses Riads)
    List<Reservation> obtenirReservationsProprietaire(UUID ownerId);

    // Valider ou confirmer une réservation (Propriétaire / Admin)
    Reservation modifierStatutReservation(UUID reservationId, String nouveauStatut, UUID userId);

    // Annuler une réservation
    void annulerReservation(UUID reservationId, UUID userId);
}
