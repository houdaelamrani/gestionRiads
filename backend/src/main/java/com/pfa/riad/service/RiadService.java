package com.pfa.riad.service;

import com.pfa.riad.dto.RiadRequest;
import com.pfa.riad.entity.Riad;

import java.util.List;
import java.util.UUID;

public interface RiadService {

    // Ajouter un nouveau Riad (Propriétaire)
    Riad ajouterRiad(RiadRequest request, UUID proprietaireId);

    // Récupérer tous les Riads d'un propriétaire spécifique (Propriétaire)
    List<Riad> obtenirRiadsProprietaire(UUID proprietaireId);

    // Récupérer les détails d'un Riad spécifique
    Riad obtenirRiadParId(UUID id);

    // Rechercher les Riads validés par ville (Client)
    List<Riad> obtenirRiadsValidesParVille(String ville);

    // Récupérer la liste des Riads en attente de validation (Admin)
    List<Riad> obtenirRiadsEnAttente(UUID adminId);

    // Valider ou approuver un Riad (Admin)
    Riad validerRiad(UUID riadId, UUID adminId);

    // Rejeter un Riad (Admin)
    Riad rejeterRiad(UUID riadId, UUID adminId);
}
