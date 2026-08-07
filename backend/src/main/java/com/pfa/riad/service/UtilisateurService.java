package com.pfa.riad.service;

import com.pfa.riad.entity.Utilisateur;

import java.util.List;
import java.util.UUID;

public interface UtilisateurService {

    // Lister tous les utilisateurs enregistrés (Admin)
    List<Utilisateur> obtenirTousLesUtilisateurs(UUID adminId);

    // Modifier le statut (Bloquer / Activer) d'un utilisateur (Admin)
    Utilisateur modifierStatutUtilisateur(UUID utilisateurId, String statut, UUID adminId);

    // Modifier le profil personnel (Nom, Prénom, Téléphone, Mot de passe)
    Utilisateur modifierProfil(UUID userId, String nom, String prenom, String telephone, String motDePasse);
}
