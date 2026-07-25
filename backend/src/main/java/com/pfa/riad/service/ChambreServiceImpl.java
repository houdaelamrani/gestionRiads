package com.pfa.riad.service;

import com.pfa.riad.dto.ChambreRequest;
import com.pfa.riad.entity.Chambre;
import com.pfa.riad.entity.Riad;
import com.pfa.riad.enums.StatutUtilisateur;
import com.pfa.riad.repository.ChambreRepository;
import com.pfa.riad.repository.RiadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChambreServiceImpl implements ChambreService {

    private final ChambreRepository chambreRepository;
    private final RiadRepository riadRepository;

    @Override
    public Chambre ajouterChambre(ChambreRequest request, UUID riadId, UUID proprietaireId) {
        // 1. Récupérer le Riad cible
        Riad riad = riadRepository.findById(riadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Riad non trouvé."));

        // 2. Vérifier que le Riad appartient bien au propriétaire connecté
        if (!riad.getProprietaire().getId().equals(proprietaireId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé. Ce Riad ne vous appartient pas.");
        }

        // 3. Vérifier que le propriétaire n'est pas bloqué
        if (riad.getProprietaire().getStatut() == StatutUtilisateur.BLOQUE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Votre compte hébergeur a été bloqué par l'administrateur.");
        }

        // 4. Créer la chambre
        Chambre chambre = Chambre.builder()
                .riad(riad)
                .nomChambre(request.getNomChambre())
                .typeChambre(request.getTypeChambre())
                .description(request.getDescription())
                .prixParNuit(request.getPrixParNuit())
                .capacite(request.getCapacite())
                .disponible(true) // Disponible par défaut
                .build();

        // 5. Sauvegarder
        return chambreRepository.save(chambre);
    }

    @Override
    public List<Chambre> obtenirChambresRiad(UUID riadId) {
        return obtenirChambresRiad(riadId, false);
    }

    @Override
    public List<Chambre> obtenirChambresRiad(UUID riadId, Boolean disponibleOnly) {
        if (Boolean.TRUE.equals(disponibleOnly)) {
            return chambreRepository.findByRiadIdAndDisponible(riadId, true);
        }
        return chambreRepository.findByRiadId(riadId);
    }


    @Override
    public Chambre modifierDisponibilite(UUID chambreId, Boolean disponible, UUID proprietaireId) {
        // 1. Récupérer la chambre
        Chambre chambre = chambreRepository.findById(chambreId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chambre non trouvée."));

        // 2. Vérifier la propriété
        Riad riad = chambre.getRiad();
        if (!riad.getProprietaire().getId().equals(proprietaireId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé. Ce Riad ne vous appartient pas.");
        }

        // 3. Modifier la disponibilité
        chambre.setDisponible(disponible);

        // 4. Sauvegarder
        return chambreRepository.save(chambre);
    }
}
