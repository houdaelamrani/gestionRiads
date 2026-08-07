package com.pfa.riad.service;

import com.pfa.riad.dto.RiadRequest;
import com.pfa.riad.entity.Riad;
import com.pfa.riad.entity.Utilisateur;
import com.pfa.riad.enums.Role;
import com.pfa.riad.enums.StatutUtilisateur;
import com.pfa.riad.enums.StatutValidation;
import com.pfa.riad.repository.RiadRepository;
import com.pfa.riad.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@org.springframework.transaction.annotation.Transactional
@RequiredArgsConstructor
public class RiadServiceImpl implements RiadService {

    private final RiadRepository riadRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Override
    public Riad ajouterRiad(RiadRequest request, UUID proprietaireId) {
        // 1. Récupérer et vérifier le propriétaire
        Utilisateur proprietaire = utilisateurRepository.findById(proprietaireId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Propriétaire non trouvé."));

        // 2. Vérifier que l'utilisateur a bien le rôle PROPRIETAIRE et n'est pas bloqué
        if (proprietaire.getRole() != Role.PROPRIETAIRE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seuls les hébergeurs/propriétaires peuvent ajouter un Riad.");
        }
        if (proprietaire.getStatut() == StatutUtilisateur.BLOQUE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Votre compte a été bloqué par l'administrateur. Action impossible.");
        }

        // 3. Créer le Riad
        Riad riad = Riad.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .adresse(request.getAdresse())
                .ville(request.getVille())
                .proprietaire(proprietaire)
                .prixRiadEntier(request.getPrixRiadEntier())
                .statutValidation(StatutValidation.EN_ATTENTE) // Tout nouveau Riad doit être approuvé par l'admin
                .build();

        // 4. Enregistrer en base de données
        return riadRepository.save(riad);
    }

    @Override
    public List<Riad> obtenirRiadsProprietaire(UUID proprietaireId) {
        // Retourne uniquement les Riads du propriétaire concerné
        return riadRepository.findByProprietaireId(proprietaireId);
    }

    @Override
    public Riad obtenirRiadParId(UUID id) {
        return riadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Riad non trouvé."));
    }

    @Override
    public List<Riad> obtenirRiadsValidesParVille(String ville) {
        // Si aucune ville n'est spécifiée ou que la recherche porte sur "Tous", retourner tous les riads validés
        if (ville == null || ville.trim().isEmpty() || ville.equalsIgnoreCase("Tous")) {
            return riadRepository.findByStatutValidation(StatutValidation.VALIDE);
        }
        return riadRepository.findByVilleAndStatutValidation(ville, StatutValidation.VALIDE);
    }

    @Override
    public List<Riad> obtenirRiadsEnAttente(UUID adminId) {
        // Vérifier que le demandeur est bien ADMIN
        validerAdmin(adminId);
        return riadRepository.findByStatutValidation(StatutValidation.EN_ATTENTE);
    }

    @Override
    public Riad validerRiad(UUID riadId, UUID adminId) {
        // 0. Vérifier que c'est bien un ADMIN
        validerAdmin(adminId);

        // 1. Récupérer le Riad
        Riad riad = riadRepository.findById(riadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Riad non trouvé."));

        // 2. Changer le statut de validation
        riad.setStatutValidation(StatutValidation.VALIDE);

        // 3. Sauvegarder
        return riadRepository.save(riad);
    }

    // ── Méthode utilitaire : vérifier le rôle ADMIN ─────────────────────────
    private void validerAdmin(UUID adminId) {
        Utilisateur admin = utilisateurRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administrateur non trouvé."));
        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé. Rôle Administrateur requis.");
        }
    }

    @Override
    public Riad rejeterRiad(UUID riadId, UUID adminId) {
        // 0. Vérifier que c'est bien un ADMIN
        validerAdmin(adminId);

        // 1. Récupérer le Riad
        Riad riad = riadRepository.findById(riadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Riad non trouvé."));

        // 2. Changer le statut à REJETE
        riad.setStatutValidation(StatutValidation.REJETE);

        // 3. Sauvegarder
        return riadRepository.save(riad);
    }

    @Override
    public Riad modifierServicesEtDetails(UUID riadId, String nom, String adresse, String description, java.math.BigDecimal prixRiadEntier, Boolean hasSpa, Boolean hasHammam, Boolean hasTraiteur, UUID proprietaireId) {
        Riad riad = riadRepository.findById(riadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Riad non trouvé."));

        if (riad.getProprietaire() == null && proprietaireId != null) {
            riad.setProprietaire(utilisateurRepository.findById(proprietaireId).orElse(null));
        }

        if (nom != null && !nom.isBlank()) riad.setNom(nom);
        if (adresse != null && !adresse.isBlank()) riad.setAdresse(adresse);
        if (description != null) riad.setDescription(description);
        if (prixRiadEntier != null) riad.setPrixRiadEntier(prixRiadEntier);
        if (hasSpa != null) riad.setHasSpa(hasSpa);
        if (hasHammam != null) riad.setHasHammam(hasHammam);
        if (hasTraiteur != null) riad.setHasTraiteur(hasTraiteur);

        return riadRepository.saveAndFlush(riad);
    }
}
