package com.pfa.riad.controller;

import com.pfa.riad.entity.Utilisateur;
import com.pfa.riad.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    // 1. Lister tous les utilisateurs (Admin)
    @GetMapping
    public ResponseEntity<List<Utilisateur>> obtenirTousLesUtilisateurs(
            @RequestHeader("X-User-Id") UUID adminId) {
        List<Utilisateur> utilisateurs = utilisateurService.obtenirTousLesUtilisateurs(adminId);
        return ResponseEntity.ok(utilisateurs);
    }

    // 2. Modifier le statut d'un utilisateur (Activer / Bloquer) (Admin)
    @PutMapping("/{id}/statut")
    public ResponseEntity<Utilisateur> modifierStatutUtilisateur(
            @PathVariable UUID id,
            @RequestParam("statut") String statut,
            @RequestHeader("X-User-Id") UUID adminId) {
        Utilisateur utilisateur = utilisateurService.modifierStatutUtilisateur(id, statut, adminId);
        return ResponseEntity.ok(utilisateur);
    }

    // 3. Modifier ses propres informations de profil (Propriétaire / Client)
    @PutMapping("/profil")
    public ResponseEntity<Utilisateur> modifierProfil(
            @RequestParam(value = "nom", required = false) String nom,
            @RequestParam(value = "prenom", required = false) String prenom,
            @RequestParam(value = "telephone", required = false) String telephone,
            @RequestParam(value = "motDePasse", required = false) String motDePasse,
            @RequestHeader("X-User-Id") UUID userId) {
        Utilisateur utilisateur = utilisateurService.modifierProfil(userId, nom, prenom, telephone, motDePasse);
        return ResponseEntity.ok(utilisateur);
    }
}
