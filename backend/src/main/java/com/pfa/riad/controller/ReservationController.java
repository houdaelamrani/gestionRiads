package com.pfa.riad.controller;

import com.pfa.riad.dto.ReservationRequest;
import com.pfa.riad.entity.Reservation;
import com.pfa.riad.service.ReservationService;
import com.pfa.riad.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReservationController {

    private final ReservationService reservationService;
    private final NotificationService notificationService;

    // 1. Créer une réservation (Client)
    @PostMapping
    public ResponseEntity<Reservation> creerReservation(
            @Valid @RequestBody ReservationRequest request,
            @RequestHeader("X-User-Id") UUID clientId) {
        Reservation reservation = reservationService.creerReservation(request, clientId);
        return new ResponseEntity<>(reservation, HttpStatus.CREATED);
    }

    // 2. Récupérer toutes les réservations du client connecté (Client)
    @GetMapping("/client")
    public ResponseEntity<List<Reservation>> obtenirReservationsClient(
            @RequestHeader("X-User-Id") UUID clientId) {
        List<Reservation> reservations = reservationService.obtenirReservationsClient(clientId);
        return ResponseEntity.ok(reservations);
    }

    // 3. Récupérer toutes les réservations reçues par l'hébergeur connecté (Propriétaire)
    @GetMapping("/owner")
    public ResponseEntity<List<Reservation>> obtenirReservationsProprietaire(
            @RequestHeader("X-User-Id") UUID ownerId) {
        List<Reservation> reservations = reservationService.obtenirReservationsProprietaire(ownerId);
        return ResponseEntity.ok(reservations);
    }

    // 4. Modifier le statut d'une réservation (Confirmer, Refuser) (Propriétaire / Admin)
    @PutMapping("/{id}/statut")
    public ResponseEntity<Reservation> modifierStatutReservation(
            @PathVariable UUID id,
            @RequestParam("statut") String statut,
            @RequestHeader("X-User-Id") UUID userId) {
        Reservation reservation = reservationService.modifierStatutReservation(id, statut, userId);
        return ResponseEntity.ok(reservation);
    }

    // 5. Annuler une réservation (Client / Propriétaire)
    @PutMapping("/{id}/annuler")
    public ResponseEntity<Void> annulerReservation(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId) {
        reservationService.annulerReservation(id, userId);
        return ResponseEntity.ok().build();
    }

    // 6. Envoyer un e-mail de rappel de séjour (Démo)
    @PostMapping("/rappel")
    public ResponseEntity<Void> envoyerRappel(@RequestBody java.util.Map<String, String> payload) {
        String nomClient = payload.get("nomClient");
        String emailClient = payload.get("emailClient");
        String nomRiad = payload.get("nomRiad");
        notificationService.envoyerRappelReservation(nomClient, emailClient, nomRiad);
        return ResponseEntity.ok().build();
    }
}
