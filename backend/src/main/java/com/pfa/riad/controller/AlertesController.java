package com.pfa.riad.controller;

import com.pfa.riad.entity.Reservation;
import com.pfa.riad.enums.StatutReservation;
import com.pfa.riad.repository.ReservationRepository;
import com.pfa.riad.repository.RiadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/proprietaire/alertes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AlertesController {

    private final ReservationRepository reservationRepository;
    private final RiadRepository riadRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> obtenirAlertesOperationnelles(
            @RequestHeader("X-User-Id") UUID proprietaireId) {

        List<Reservation> toutesReservations = reservationRepository.findByRiadProprietaireIdOrderByDateCreationDesc(proprietaireId);

        LocalDate aujourdhui = LocalDate.now();

        // 1. Nouvelles réservations en attente d'approbation
        List<Reservation> enAttente = toutesReservations.stream()
                .filter(r -> r.getStatut() == StatutReservation.EN_ATTENTE)
                .toList();

        // 2. Arrivées du jour (Check-in = aujourd'hui ou demain, ou en cours de séjour)
        List<Reservation> arriveesDuJour = toutesReservations.stream()
                .filter(r -> r.getStatut() != StatutReservation.ANNULEE)
                .filter(r -> r.getDateDebut() != null && (
                        r.getDateDebut().isEqual(aujourdhui) ||
                        r.getDateDebut().isEqual(aujourdhui.plusDays(1)) ||
                        (!r.getDateDebut().isAfter(aujourdhui) && !r.getDateFin().isBefore(aujourdhui) && Boolean.FALSE.equals(r.getCheckInEffectue()))
                ))
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("arriveesAujourdhui", arriveesDuJour);
        result.put("nouvellesReservations", enAttente);
        result.put("stats", Map.of(
                "arriveesDuJour", arriveesDuJour.size(),
                "reservationsEnAttente", enAttente.size()
        ));

        return ResponseEntity.ok(result);
    }
}
