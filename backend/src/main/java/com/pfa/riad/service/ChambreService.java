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
}
