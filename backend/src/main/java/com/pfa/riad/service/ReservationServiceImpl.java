package com.pfa.riad.service;

import com.pfa.riad.dto.ReservationRequest;
import com.pfa.riad.entity.Chambre;
import com.pfa.riad.entity.Paiement;
import com.pfa.riad.entity.Reservation;
import com.pfa.riad.entity.Riad;
import com.pfa.riad.entity.Utilisateur;
import com.pfa.riad.enums.MethodePaiement;
import com.pfa.riad.enums.StatutPaiement;
import com.pfa.riad.enums.StatutReservation;
import com.pfa.riad.repository.ChambreRepository;
import com.pfa.riad.repository.PaiementRepository;
import com.pfa.riad.repository.ReservationRepository;
import com.pfa.riad.repository.RiadRepository;
import com.pfa.riad.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final PaiementRepository paiementRepository;
    private final RiadRepository riadRepository;
    private final ChambreRepository chambreRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public Reservation creerReservation(ReservationRequest request, UUID clientId) {
        // 1. Récupérer le client
        Utilisateur client = utilisateurRepository.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client non trouvé."));

        // 2. Récupérer le Riad
        Riad riad = riadRepository.findById(request.getRiadId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Riad non trouvé."));

        // 3. Valider les dates
        if (request.getDateDebut().isAfter(request.getDateFin()) || request.getDateDebut().equals(request.getDateFin())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La date de début doit être antérieure à la date de fin.");
        }

        long nuits = ChronoUnit.DAYS.between(request.getDateDebut(), request.getDateFin());
        if (nuits <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le séjour doit être d'au moins 1 nuit.");
        }

        // 4. Calculer le tarif total et lier les chambres
        BigDecimal prixTotal = BigDecimal.ZERO;
        Set<Chambre> chambresAReserver = new HashSet<>();

        if (request.getRiadEntier()) {
            // Option 1 : Riad en entier
            if (riad.getPrixRiadEntier() == null || riad.getPrixRiadEntier().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ce Riad n'est pas disponible pour une location complète.");
            }
            prixTotal = riad.getPrixRiadEntier().multiply(BigDecimal.valueOf(nuits));

            // Récupérer toutes les chambres du riad
            List<Chambre> chambresDuRiad = chambreRepository.findByRiadId(riad.getId());
            chambresAReserver.addAll(chambresDuRiad);
        } else {
            // Option 2 : Location par chambre(s)
            if (request.getChambreIds() == null || request.getChambreIds().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous devez choisir au moins une chambre.");
            }

            BigDecimal prixNuitCumule = BigDecimal.ZERO;
            for (UUID chambreId : request.getChambreIds()) {
                Chambre chambre = chambreRepository.findById(chambreId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chambre non trouvée."));

                // Vérifier que la chambre appartient bien au riad
                if (!chambre.getRiad().getId().equals(riad.getId())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La chambre " + chambre.getNomChambre() + " n'appartient pas au Riad sélectionné.");
                }

                // Vérifier si la chambre est disponible
                if (!chambre.getDisponible()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La chambre " + chambre.getNomChambre() + " n'est pas disponible pour le moment.");
                }

                prixNuitCumule = prixNuitCumule.add(chambre.getPrixParNuit());
                chambresAReserver.add(chambre);
            }
            prixTotal = prixNuitCumule.multiply(BigDecimal.valueOf(nuits));
        }

        // 5. Configurer le statut initial (Confirmée si payée en ligne, en attente si payée sur place)
        StatutReservation statutInitial = StatutReservation.EN_ATTENTE;
        MethodePaiement methode = MethodePaiement.valueOf(request.getMethodePaiement());
        if (methode == MethodePaiement.CARTE_BANCAIRE || methode == MethodePaiement.PAYPAL) {
            statutInitial = StatutReservation.CONFIRMEE;
        }

        // 6. Enregistrer la réservation
        Reservation reservation = Reservation.builder()
                .client(client)
                .riad(riad)
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .prixTotal(prixTotal)
                .statut(statutInitial)
                .riadEntier(request.getRiadEntier())
                .chambres(chambresAReserver)
                .build();

        Reservation savedReservation = reservationRepository.save(reservation);

        // 7. Générer l'enregistrement de paiement associé
        StatutPaiement statutPaiement = StatutPaiement.EN_ATTENTE;
        if (methode == MethodePaiement.CARTE_BANCAIRE || methode == MethodePaiement.PAYPAL) {
            statutPaiement = StatutPaiement.REUSSI;
        }

        Paiement paiement = Paiement.builder()
                .reservation(savedReservation)
                .montant(prixTotal)
                .methodePaiement(methode)
                .statutPaiement(statutPaiement)
                .build();

        paiementRepository.save(paiement);

        // Envoi des notifications de confirmation (simulation)
        String datesStr = String.format("%s au %s", savedReservation.getDateDebut().toString(), savedReservation.getDateFin().toString());
        notificationService.envoyerConfirmationReservation(
                client.getPrenom() + " " + client.getNom(),
                client.getEmail(),
                client.getTelephone(),
                riad.getNom(),
                datesStr
        );

        return savedReservation;
    }

    @Override
    public List<Reservation> obtenirReservationsClient(UUID clientId) {
        return reservationRepository.findByClientIdOrderByDateCreationDesc(clientId);
    }

    @Override
    public List<Reservation> obtenirReservationsProprietaire(UUID ownerId) {
        return reservationRepository.findByRiadProprietaireIdOrderByDateCreationDesc(ownerId);
    }

    @Override
    @Transactional
    public Reservation modifierStatutReservation(UUID reservationId, String nouveauStatut, UUID userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Réservation non trouvée."));

        // Vérifier si l'utilisateur est le propriétaire du Riad ou l'administrateur
        boolean estProprietaire = reservation.getRiad().getProprietaire().getId().equals(userId);
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur non trouvé."));
        boolean estAdmin = user.getRole().name().equals("ADMIN");

        if (!estProprietaire && !estAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'avez pas l'autorisation de modifier cette réservation.");
        }

        try {
            StatutReservation statut = StatutReservation.valueOf(nouveauStatut);
            reservation.setStatut(statut);
            return reservationRepository.save(reservation);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut de réservation invalide.");
        }
    }

    @Override
    @Transactional
    public void annulerReservation(UUID reservationId, UUID userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Réservation non trouvée."));

        // Autoriser l'annulation uniquement au client qui a réservé, ou au propriétaire du riad
        boolean estLeClient = reservation.getClient() != null && reservation.getClient().getId().equals(userId);
        boolean estProprietaire = reservation.getRiad().getProprietaire().getId().equals(userId);

        if (!estLeClient && !estProprietaire) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'avez pas l'autorisation d'annuler cette réservation.");
        }

        reservation.setStatut(StatutReservation.ANNULEE);
        reservationRepository.save(reservation);
    }
}
