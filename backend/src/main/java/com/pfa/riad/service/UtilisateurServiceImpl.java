package com.pfa.riad.service;

import com.pfa.riad.entity.Utilisateur;
import com.pfa.riad.enums.Role;
import com.pfa.riad.enums.StatutUtilisateur;
import com.pfa.riad.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UtilisateurServiceImpl implements UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public List<Utilisateur> obtenirTousLesUtilisateurs(UUID adminId) {
        // Valider que le demandeur est bien ADMIN
        validerAdmin(adminId);
        return utilisateurRepository.findAll();
    }

    @Override
    @Transactional
    public Utilisateur modifierStatutUtilisateur(UUID utilisateurId, String statut, UUID adminId) {
        // Valider que le demandeur est bien ADMIN
        validerAdmin(adminId);

        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur non trouvé."));

        // Empêcher un admin de s'auto-bloquer
        if (utilisateur.getId().equals(adminId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous ne pouvez pas modifier votre propre statut.");
        }

        try {
            StatutUtilisateur statutEnum = StatutUtilisateur.valueOf(statut);
            utilisateur.setStatut(statutEnum);
            return utilisateurRepository.save(utilisateur);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut utilisateur invalide.");
        }
    }

    @Override
    @Transactional
    public Utilisateur modifierProfil(UUID userId, String nom, String prenom, String telephone, String motDePasse) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur non trouvé."));

        if (nom != null && !nom.trim().isEmpty()) user.setNom(nom.trim());
        if (prenom != null && !prenom.trim().isEmpty()) user.setPrenom(prenom.trim());
        if (telephone != null) user.setTelephone(telephone.trim());
        if (motDePasse != null && !motDePasse.trim().isEmpty() && motDePasse.length() >= 6) {
            user.setMotDePasse(passwordEncoder.encode(motDePasse.trim()));
        }

        return utilisateurRepository.save(user);
    }

    private void validerAdmin(UUID adminId) {
        Utilisateur admin = utilisateurRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administrateur non trouvé."));
        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès interdit. Rôle Administrateur requis.");
        }
    }
}
