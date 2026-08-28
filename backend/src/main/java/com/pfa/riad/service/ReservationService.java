package com.pfa.riad.service;

import com.pfa.riad.dto.PlanningDateDto;
import com.pfa.riad.dto.ReservationRequest;
import com.pfa.riad.entity.Reservation;

import java.util.List;
import java.util.UUID;

public interface ReservationService {

    // Créer une nouvelle réservation pour un client (connecté ou invité)
    Reservation creerReservation(ReservationRequest request, UUID clientId);

    // Lister toutes les réservations d'un client
    List<Reservation> obtenirReservationsClient(UUID clientId);

    // Lister les réservations d'un invité / client par email
    List<Reservation> obtenirReservationsParEmail(String email);

    // Lister toutes les réservations reçues par un propriétaire (pour ses Riads)
    List<Reservation> obtenirReservationsProprietaire(UUID ownerId);

    // Valider ou confirmer une réservation (Propriétaire / Admin)
    Reservation modifierStatutReservation(UUID reservationId, String nouveauStatut, UUID userId);

    // Annuler une réservation
    void annulerReservation(UUID reservationId, UUID userId);

    // Enregistrer le check-in du client à son arrivée au Riad (saisie CIN/Passeport, validation, etc.)
    Reservation effectuerCheckIn(UUID reservationId, com.pfa.riad.dto.CheckInRequest request, UUID userId);

    // Obtenir les plages de dates occupées et réservées pour le calendrier d'un Riad
    List<PlanningDateDto> obtenirPlanningDates(UUID riadId);
}
