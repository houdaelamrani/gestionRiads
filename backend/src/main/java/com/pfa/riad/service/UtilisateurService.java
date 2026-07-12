package com.pfa.riad.service;

import com.pfa.riad.entity.Utilisateur;

import java.util.List;
import java.util.UUID;

public interface UtilisateurService {

    // Lister tous les utilisateurs enregistrés (Admin)
    List<Utilisateur> obtenirTousLesUtilisateurs(UUID adminId);

    // Modifier le statut (Bloquer / Activer) d'un utilisateur (Admin)
    Utilisateur modifierStatutUtilisateur(UUID utilisateurId, String statut, UUID adminId);
}
