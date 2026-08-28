package com.pfa.riad.service;

import com.pfa.riad.dto.CheckInRequest;
import com.pfa.riad.dto.PlanningDateDto;
import com.pfa.riad.dto.ReservationRequest;
import com.pfa.riad.entity.Chambre;
import com.pfa.riad.entity.Paiement;
import com.pfa.riad.entity.Reservation;
import com.pfa.riad.entity.Riad;
import com.pfa.riad.entity.Utilisateur;
import com.pfa.riad.enums.MethodePaiement;
import com.pfa.riad.enums.Role;
import com.pfa.riad.enums.StatutChambre;
import com.pfa.riad.enums.StatutPaiement;
import com.pfa.riad.enums.StatutReservation;
import com.pfa.riad.enums.StatutUtilisateur;
import com.pfa.riad.repository.ChambreRepository;
import com.pfa.riad.repository.PaiementRepository;
import com.pfa.riad.repository.ReservationRepository;
import com.pfa.riad.repository.RiadRepository;
import com.pfa.riad.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
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
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public Reservation creerReservation(ReservationRequest request, UUID clientId) {
        // 1. Récupérer ou créer le compte client
        Utilisateur client = null;
        if (clientId != null) {
            client = utilisateurRepository.findById(clientId).orElse(null);
        }

        if (client == null) {
            String email = request.getEmail();
            if (email == null || email.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Une adresse email valide est obligatoire pour la réservation.");
            }
            email = email.trim().toLowerCase();

            client = utilisateurRepository.findByEmail(email).orElse(null);

            if (client == null) {
                String nom = (request.getNom() != null && !request.getNom().trim().isEmpty()) ? request.getNom().trim() : "Client";
                String prenom = (request.getPrenom() != null && !request.getPrenom().trim().isEmpty()) ? request.getPrenom().trim() : "Invité";
                String telephone = request.getTelephone();

                client = Utilisateur.builder()
                        .nom(nom)
                        .prenom(prenom)
                        .email(email)
                        .telephone(telephone)
                        .motDePasse(passwordEncoder.encode("client@" + UUID.randomUUID().toString().substring(0, 8)))
                        .role(Role.CLIENT)
                        .statut(StatutUtilisateur.ACTIF)
                        .build();

                client = utilisateurRepository.save(client);
            } else {
                if (request.getTelephone() != null && !request.getTelephone().isBlank()) {
                    client.setTelephone(request.getTelephone());
                }
                if (request.getNom() != null && !request.getNom().isBlank()) {
                    client.setNom(request.getNom());
                }
                if (request.getPrenom() != null && !request.getPrenom().isBlank()) {
                    client.setPrenom(request.getPrenom());
                }
                client = utilisateurRepository.save(client);
            }
        }

        // 2. Récupérer le Riad
        Riad riad = riadRepository.findById(request.getRiadId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Riad non trouvé."));

        // 3. Valider les dates
        if (request.getDateDebut().isBefore(java.time.LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La date d'arrivée ne peut pas être dans le passé.");
        }
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
            if (riad.getPrixRiadEntier() == null || riad.getPrixRiadEntier().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ce Riad n'est pas disponible pour une location complète.");
            }
            prixTotal = riad.getPrixRiadEntier().multiply(BigDecimal.valueOf(nuits));

            List<Chambre> chambresDuRiad = chambreRepository.findByRiadId(riad.getId());
            chambresAReserver.addAll(chambresDuRiad);
        } else {
            if (request.getChambreIds() == null || request.getChambreIds().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous devez choisir au moins une chambre.");
            }

            BigDecimal prixNuitCumule = BigDecimal.ZERO;
            for (UUID chambreId : request.getChambreIds()) {
                Chambre chambre = chambreRepository.findById(chambreId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chambre non trouvée."));

                if (!chambre.getRiad().getId().equals(riad.getId())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La chambre " + chambre.getNomChambre() + " n'appartient pas au Riad sélectionné.");
                }

                if (chambre.getStatut() == StatutChambre.HORS_SERVICE) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La chambre " + chambre.getNomChambre() + " est temporairement hors service.");
                }

                prixNuitCumule = prixNuitCumule.add(chambre.getPrixParNuit());
                chambresAReserver.add(chambre);
            }
            prixTotal = prixNuitCumule.multiply(BigDecimal.valueOf(nuits));
        }

        // 5. Vérifier les conflits de dates avec les réservations existantes (EN_ATTENTE ou CONFIRMEE)
        List<Reservation> existantes = reservationRepository.findByRiadIdOrderByDateCreationDesc(riad.getId());
        for (Reservation ex : existantes) {
            if (ex.getStatut() == StatutReservation.ANNULEE) continue;

            boolean chevauchement = !(request.getDateFin().compareTo(ex.getDateDebut()) <= 0 || request.getDateDebut().compareTo(ex.getDateFin()) >= 0);
            if (chevauchement) {
                if (ex.getRiadEntier() || request.getRiadEntier()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Le Riad est déjà réservé ou occupé pour les dates sélectionnées.");
                }
                for (Chambre chDemande : chambresAReserver) {
                    if (ex.getChambres().contains(chDemande)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "La chambre « " + chDemande.getNomChambre() + " » est déjà réservée ou occupée pour ces dates.");
                    }
                }
            }
        }

        // 6. Configurer le statut initial :
        // - Si paiement sur place : statut = EN_ATTENTE, paiement = EN_ATTENTE
        // - Si carte / paypal : statut = CONFIRMEE, paiement = REUSSI
        MethodePaiement methode = MethodePaiement.valueOf(request.getMethodePaiement());
        StatutReservation statutInitial = StatutReservation.EN_ATTENTE;
        StatutPaiement statutPaiement = StatutPaiement.EN_ATTENTE;

        if (methode == MethodePaiement.CARTE_BANCAIRE || methode == MethodePaiement.PAYPAL) {
            statutInitial = StatutReservation.CONFIRMEE;
            statutPaiement = StatutPaiement.REUSSI;
        }

        // 7. Enregistrer la réservation
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

        // 9. Générer l'enregistrement de paiement associé
        Paiement paiement = Paiement.builder()
                .reservation(savedReservation)
                .montant(prixTotal)
                .methodePaiement(methode)
                .statutPaiement(statutPaiement)
                .build();

        paiementRepository.save(paiement);

        // 10. Envoi des notifications selon le mode de paiement
        String datesStr = String.format("%s au %s", savedReservation.getDateDebut().toString(), savedReservation.getDateFin().toString());
        String clientNomComplet = client.getPrenom() + " " + client.getNom();

        if (methode == MethodePaiement.SUR_PLACE) {
            notificationService.envoyerNotificationPaiementSurPlace(
                    clientNomComplet,
                    client.getEmail(),
                    client.getTelephone(),
                    riad.getNom(),
                    datesStr,
                    savedReservation.getDateDebut().toString()
            );
        } else {
            notificationService.envoyerConfirmationReservation(
                    clientNomComplet,
                    client.getEmail(),
                    client.getTelephone(),
                    riad.getNom(),
                    datesStr
            );
        }

        return savedReservation;
    }

    @Override
    public List<PlanningDateDto> obtenirPlanningDates(UUID riadId) {
        List<Reservation> reservations = reservationRepository.findByRiadIdOrderByDateCreationDesc(riadId);
        List<PlanningDateDto> planning = new ArrayList<>();

        for (Reservation res : reservations) {
            if (res.getStatut() == StatutReservation.ANNULEE) continue;

            // Si confirmée (payée) -> OCCUPE, sinon (en attente / paiement sur place) -> RESERVE
            String statutAffichage = (res.getStatut() == StatutReservation.CONFIRMEE) ? "OCCUPE" : "RESERVE";

            if (res.getRiadEntier()) {
                planning.add(PlanningDateDto.builder()
                        .reservationId(res.getId())
                        .chambreId(null)
                        .nomChambre("Riad Entier")
                        .riadEntier(true)
                        .dateDebut(res.getDateDebut())
                        .dateFin(res.getDateFin())
                        .statut(statutAffichage)
                        .statutReservation(res.getStatut().name())
                        .build());
            } else {
                for (Chambre ch : res.getChambres()) {
                    planning.add(PlanningDateDto.builder()
                            .reservationId(res.getId())
                            .chambreId(ch.getId())
                            .nomChambre(ch.getNomChambre())
                            .riadEntier(false)
                            .dateDebut(res.getDateDebut())
                            .dateFin(res.getDateFin())
                            .statut(statutAffichage)
                            .statutReservation(res.getStatut().name())
                            .build());
                }
            }
        }

        return planning;
    }

    @Override
    public List<Reservation> obtenirReservationsClient(UUID clientId) {
        return reservationRepository.findByClientIdOrderByDateCreationDesc(clientId);
    }

    @Override
    public List<Reservation> obtenirReservationsParEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return reservationRepository.findByClientEmailIgnoreCaseOrderByDateCreationDesc(email.trim());
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

            // Si confirmée (par ex: propriétaire valide paiement sur place) -> passer paiement en REUSSI et chambres en OCCUPEE
            if (statut == StatutReservation.CONFIRMEE) {
                List<Paiement> paiements = paiementRepository.findByReservationId(reservation.getId());
                for (Paiement p : paiements) {
                    p.setStatutPaiement(StatutPaiement.REUSSI);
                    paiementRepository.save(p);
                }
            }

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

        boolean estLeClient = reservation.getClient() != null && reservation.getClient().getId().equals(userId);
        boolean estProprietaire = reservation.getRiad().getProprietaire().getId().equals(userId);

        if (!estLeClient && !estProprietaire) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'avez pas l'autorisation d'annuler cette réservation.");
        }

        reservation.setStatut(StatutReservation.ANNULEE);
        reservationRepository.save(reservation);
    }

    @Override
    @Transactional
    public Reservation effectuerCheckIn(UUID reservationId, CheckInRequest request, UUID userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Réservation non trouvée."));

        boolean estProprietaire = reservation.getRiad().getProprietaire().getId().equals(userId);
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur non trouvé."));
        boolean estAdmin = user.getRole().name().equals("ADMIN");

        if (!estProprietaire && !estAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'avez pas l'autorisation d'effectuer le check-in pour cette réservation.");
        }

        if (reservation.getStatut() == StatutReservation.ANNULEE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible d'effectuer le check-in sur une réservation annulée.");
        }

        // 1. Enregistrer les informations d'identité du client vérifiées à l'arrivée
        reservation.setCheckInEffectue(true);
        reservation.setDateHeureCheckIn(java.time.LocalDateTime.now());
        reservation.setStatut(StatutReservation.CONFIRMEE);

        if (request.getNom() != null && !request.getNom().isBlank()) {
            reservation.setClientNom(request.getNom().trim());
        }
        if (request.getPrenom() != null && !request.getPrenom().isBlank()) {
            reservation.setClientPrenom(request.getPrenom().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            reservation.setClientEmail(request.getEmail().trim());
        }
        if (request.getTelephone() != null && !request.getTelephone().isBlank()) {
            reservation.setClientTelephone(request.getTelephone().trim());
        }
        reservation.setClientTypePieceIdentite(request.getTypePieceIdentite());
        reservation.setClientNumeroPieceIdentite(request.getNumeroPieceIdentite());
        reservation.setClientNationalite(request.getNationalite());
        reservation.setClientDateNaissance(request.getDateNaissance());
        reservation.setNombrePersonnes(request.getNombrePersonnes() != null && request.getNombrePersonnes() > 0 ? request.getNombrePersonnes() : 1);
        reservation.setRemarquesCheckIn(request.getRemarques());

        // 2. Gestion de l'encaissement / paiement sur place si applicable
        if (Boolean.TRUE.equals(request.getPaiementEffectueSurPlace()) || request.getMethodePaiementSurPlace() != null) {
            reservation.setMethodePaiementCheckIn(request.getMethodePaiementSurPlace() != null ? request.getMethodePaiementSurPlace() : "ESPECES");
            List<Paiement> paiements = paiementRepository.findByReservationId(reservation.getId());
            for (Paiement p : paiements) {
                p.setStatutPaiement(StatutPaiement.REUSSI);
                if (request.getMethodePaiementSurPlace() != null && request.getMethodePaiementSurPlace().equalsIgnoreCase("CARTE_BANCAIRE")) {
                    p.setMethodePaiement(MethodePaiement.CARTE_BANCAIRE);
                } else if (request.getMethodePaiementSurPlace() != null && request.getMethodePaiementSurPlace().equalsIgnoreCase("SUR_PLACE")) {
                    p.setMethodePaiement(MethodePaiement.SUR_PLACE);
                }
                paiementRepository.save(p);
            }
        }

        Reservation savedReservation = reservationRepository.save(reservation);

        // 3. Notification de bienvenue & confirmation de Check-in
        String clientEmail = savedReservation.getClientEmail() != null ? savedReservation.getClientEmail() : (savedReservation.getClient() != null ? savedReservation.getClient().getEmail() : "");
        String clientNomComplet = (savedReservation.getClientPrenom() != null ? savedReservation.getClientPrenom() : "") + " " + (savedReservation.getClientNom() != null ? savedReservation.getClientNom() : "");
        String clientTel = savedReservation.getClientTelephone() != null ? savedReservation.getClientTelephone() : (savedReservation.getClient() != null ? savedReservation.getClient().getTelephone() : "");
        String datesStr = String.format("%s au %s", savedReservation.getDateDebut().toString(), savedReservation.getDateFin().toString());

        StringBuilder chambresNoms = new StringBuilder();
        if (savedReservation.getRiadEntier()) {
            chambresNoms.append("Riad Entier");
        } else if (savedReservation.getChambres() != null) {
            for (Chambre c : savedReservation.getChambres()) {
                if (chambresNoms.length() > 0) chambresNoms.append(", ");
                chambresNoms.append(c.getNomChambre());
            }
        }

        notificationService.envoyerConfirmationCheckIn(
                clientNomComplet.trim(),
                clientEmail,
                clientTel,
                savedReservation.getRiad().getNom(),
                datesStr,
                savedReservation.getClientTypePieceIdentite(),
                savedReservation.getClientNumeroPieceIdentite(),
                chambresNoms.toString()
        );

        return savedReservation;
    }
}
