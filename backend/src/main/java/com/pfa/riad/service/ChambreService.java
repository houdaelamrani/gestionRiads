package com.pfa.riad.service;

import com.pfa.riad.dto.ChambreRequest;
import com.pfa.riad.entity.Chambre;

import java.util.List;
import java.util.UUID;

public interface ChambreService {

    // Ajouter une chambre dans un Riad (Propriétaire)
    Chambre ajouterChambre(ChambreRequest request, UUID riadId, UUID proprietaireId);

    // Obtenir la liste des chambres d'un Riad
    List<Chambre> obtenirChambresRiad(UUID riadId);

    // Obtenir la liste des chambres d'un Riad avec filtrage optionnel de disponibilité
    List<Chambre> obtenirChambresRiad(UUID riadId, Boolean disponibleOnly);

    // Modifier la disponibilité d'une chambre (Propriétaire)
    Chambre modifierDisponibilite(UUID chambreId, Boolean disponible, UUID proprietaireId);

    // Supprimer une chambre (Propriétaire)
    void supprimerChambre(UUID chambreId, UUID proprietaireId);

    // Modifier le tarif et la capacité d'une chambre (Propriétaire)
    Chambre modifierPrixEtCapacite(UUID chambreId, java.math.BigDecimal prixParNuit, Integer capacite, UUID proprietaireId);

    // Modifier une chambre complète (Nom, Type, Tarif, Capacité, Description, Disponibilité)
    Chambre modifierChambre(UUID chambreId, ChambreRequest request, Boolean disponible, UUID proprietaireId);
}
