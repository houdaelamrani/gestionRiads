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
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
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

    // 2. Récupérer toutes les chambres d'un Riad spécifique (Public)
    @GetMapping("/api/riads/{riadId}/chambres")
    public ResponseEntity<List<Chambre>> obtenirChambresRiad(@PathVariable UUID riadId) {
        List<Chambre> chambres = chambreService.obtenirChambresRiad(riadId);
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
}
