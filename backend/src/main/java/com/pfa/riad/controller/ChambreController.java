package com.pfa.riad.controller;

import com.pfa.riad.dto.ChambreRequest;
import com.pfa.riad.entity.Chambre;
import com.pfa.riad.service.ChambreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChambreController {

    private final ChambreService chambreService;

    // 1. Ajouter une chambre dans un Riad spécifique (Propriétaire)
    @PostMapping("/api/riads/{riadId}/chambres")
    public ResponseEntity<Chambre> ajouterChambre(
            @Valid @RequestBody ChambreRequest request,
            @PathVariable UUID riadId,
            @RequestHeader("X-User-Id") UUID proprietaireId) {
        Chambre chambre = chambreService.ajouterChambre(request, riadId, proprietaireId);
        return new ResponseEntity<>(chambre, HttpStatus.CREATED);
    }

    // 2. Récupérer les chambres d'un Riad spécifique (Public) avec filtrage optionnel disponibleOnly
    @GetMapping("/api/riads/{riadId}/chambres")
    public ResponseEntity<List<Chambre>> obtenirChambresRiad(
            @PathVariable UUID riadId,
            @RequestParam(value = "disponibleOnly", required = false) Boolean disponibleOnly) {
        List<Chambre> chambres = chambreService.obtenirChambresRiad(riadId, disponibleOnly);
        return ResponseEntity.ok(chambres);
    }


    // 3. Modifier la disponibilité d'une chambre (Propriétaire)
    @PutMapping("/api/chambres/{chambreId}/disponibilite")
    public ResponseEntity<Chambre> modifierDisponibilite(
            @RequestParam("disponible") Boolean disponible,
            @PathVariable UUID chambreId,
            @RequestHeader("X-User-Id") UUID proprietaireId) {
        Chambre chambre = chambreService.modifierDisponibilite(chambreId, disponible, proprietaireId);
        return ResponseEntity.ok(chambre);
    }

    // 4. Supprimer une chambre (Propriétaire)
    @DeleteMapping("/api/chambres/{chambreId}")
    public ResponseEntity<Void> supprimerChambre(
            @PathVariable UUID chambreId,
            @RequestHeader("X-User-Id") UUID proprietaireId) {
        chambreService.supprimerChambre(chambreId, proprietaireId);
        return ResponseEntity.noContent().build();
    }

    // 5. Modifier le tarif et la capacité d'une chambre (Propriétaire)
    @PutMapping("/api/chambres/{chambreId}/tarif")
    public ResponseEntity<Chambre> modifierTarif(
            @PathVariable UUID chambreId,
            @RequestParam(value = "prixParNuit", required = false) java.math.BigDecimal prixParNuit,
            @RequestParam(value = "capacite", required = false) Integer capacite,
            @RequestHeader("X-User-Id") UUID proprietaireId) {
        Chambre chambre = chambreService.modifierPrixEtCapacite(chambreId, prixParNuit, capacite, proprietaireId);
        return ResponseEntity.ok(chambre);
    }

    // 6. Modifier entièrement une chambre (Propriétaire)
    @PutMapping("/api/chambres/{chambreId}")
    public ResponseEntity<Chambre> modifierChambre(
            @PathVariable UUID chambreId,
            @RequestBody ChambreRequest request,
            @RequestParam(value = "disponible", required = false) Boolean disponible,
            @RequestHeader("X-User-Id") UUID proprietaireId) {
        Chambre chambre = chambreService.modifierChambre(chambreId, request, disponible, proprietaireId);
        return ResponseEntity.ok(chambre);
    }
}
