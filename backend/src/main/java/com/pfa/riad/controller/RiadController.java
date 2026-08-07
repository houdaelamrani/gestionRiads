package com.pfa.riad.controller;

import com.pfa.riad.dto.RiadRequest;
import com.pfa.riad.entity.Riad;
import com.pfa.riad.service.RiadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/riads")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RiadController {

    private final RiadService riadService;

    // 1. Ajouter un Riad (Propriétaire)
    // L'ID du propriétaire est transmis dans l'en-tête HTTP 'X-User-Id' (injecté après connexion)
    @PostMapping
    public ResponseEntity<Riad> ajouterRiad(
            @Valid @RequestBody RiadRequest request,
            @RequestHeader("X-User-Id") UUID proprietaireId) {
        Riad riad = riadService.ajouterRiad(request, proprietaireId);
        return new ResponseEntity<>(riad, HttpStatus.CREATED);
    }

    // 2. Récupérer uniquement les Riads du propriétaire connecté
    @GetMapping("/owner")
    public ResponseEntity<List<Riad>> obtenirRiadsProprietaire(
            @RequestHeader("X-User-Id") UUID proprietaireId) {
        List<Riad> riads = riadService.obtenirRiadsProprietaire(proprietaireId);
        return ResponseEntity.ok(riads);
    }

    // 3. Récupérer les détails d'un Riad par son ID (Public)
    @GetMapping("/{id}")
    public ResponseEntity<Riad> obtenirRiadParId(@PathVariable UUID id) {
        Riad riad = riadService.obtenirRiadParId(id);
        return ResponseEntity.ok(riad);
    }

    // 4. Rechercher et filtrer les Riads validés par ville (Public - Client)
    // Exemple d'usage : /api/riads/recherche?ville=Marrakech
    @GetMapping("/recherche")
    public ResponseEntity<List<Riad>> obtenirRiadsValidesParVille(
            @RequestParam(value = "ville", required = false, defaultValue = "Tous") String ville) {
        List<Riad> riads = riadService.obtenirRiadsValidesParVille(ville);
        return ResponseEntity.ok(riads);
    }

    // 5. Récupérer les Riads en attente de validation (Admin)
    @GetMapping("/en-attente")
    public ResponseEntity<List<Riad>> obtenirRiadsEnAttente(
            @RequestHeader("X-User-Id") UUID adminId) {
        List<Riad> riads = riadService.obtenirRiadsEnAttente(adminId);
        return ResponseEntity.ok(riads);
    }

    // 6. Valider un Riad (Admin)
    @PutMapping("/{id}/valider")
    public ResponseEntity<Riad> validerRiad(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID adminId) {
        Riad riad = riadService.validerRiad(id, adminId);
        return ResponseEntity.ok(riad);
    }

    // 7. Rejeter un Riad (Admin)
    @PutMapping("/{id}/rejeter")
    public ResponseEntity<Riad> rejeterRiad(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID adminId) {
        Riad riad = riadService.rejeterRiad(id, adminId);
        return ResponseEntity.ok(riad);
    }

    // 8. Modifier les détails et les services additionnels du Riad (Propriétaire)
    @PutMapping("/{id}/services")
    public ResponseEntity<Riad> modifierServicesEtDetails(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            @RequestParam(value = "nom", required = false) String nom,
            @RequestParam(value = "adresse", required = false) String adresse,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "prixRiadEntier", required = false) java.math.BigDecimal prixRiadEntier,
            @RequestParam(value = "hasSpa", required = false) Boolean hasSpa,
            @RequestParam(value = "hasHammam", required = false) Boolean hasHammam,
            @RequestParam(value = "hasTraiteur", required = false) Boolean hasTraiteur,
            @RequestHeader(value = "X-User-Id", required = false) UUID proprietaireId) {

        if (body != null) {
            if (body.get("nom") != null) nom = body.get("nom").toString();
            if (body.get("adresse") != null) adresse = body.get("adresse").toString();
            if (body.get("description") != null) description = body.get("description").toString();
            if (body.get("prixRiadEntier") != null && !body.get("prixRiadEntier").toString().isBlank()) {
                try {
                    prixRiadEntier = new java.math.BigDecimal(body.get("prixRiadEntier").toString());
                } catch (Exception ignored) {}
            }
            if (body.get("hasSpa") != null) hasSpa = Boolean.parseBoolean(body.get("hasSpa").toString());
            if (body.get("hasHammam") != null) hasHammam = Boolean.parseBoolean(body.get("hasHammam").toString());
            if (body.get("hasTraiteur") != null) hasTraiteur = Boolean.parseBoolean(body.get("hasTraiteur").toString());
        }

        Riad riad = riadService.modifierServicesEtDetails(id, nom, adresse, description, prixRiadEntier, hasSpa, hasHammam, hasTraiteur, proprietaireId);
        return ResponseEntity.ok(riad);
    }

    // 9. Modifier un Riad (Alias direct sur /{id})
    @PutMapping("/{id}")
    public ResponseEntity<Riad> modifierRiadAlias(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            @RequestParam(value = "nom", required = false) String nom,
            @RequestParam(value = "adresse", required = false) String adresse,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "prixRiadEntier", required = false) java.math.BigDecimal prixRiadEntier,
            @RequestParam(value = "hasSpa", required = false) Boolean hasSpa,
            @RequestParam(value = "hasHammam", required = false) Boolean hasHammam,
            @RequestParam(value = "hasTraiteur", required = false) Boolean hasTraiteur,
            @RequestHeader(value = "X-User-Id", required = false) UUID proprietaireId) {
        return modifierServicesEtDetails(id, body, nom, adresse, description, prixRiadEntier, hasSpa, hasHammam, hasTraiteur, proprietaireId);
    }
}
