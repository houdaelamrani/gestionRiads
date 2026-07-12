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
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
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
}
