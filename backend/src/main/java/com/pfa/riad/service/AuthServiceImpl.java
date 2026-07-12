package com.pfa.riad.service;

import com.pfa.riad.dto.AuthResponse;
import com.pfa.riad.dto.ConnexionRequest;
import com.pfa.riad.dto.InscriptionRequest;
import com.pfa.riad.entity.Utilisateur;
import com.pfa.riad.enums.StatutUtilisateur;
import com.pfa.riad.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse inscrire(InscriptionRequest request) {
        // 1. Vérifier si l'email existe déjà
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cet email est déjà utilisé par un autre compte.");
        }

        // 2. Créer le nouvel utilisateur
        Utilisateur utilisateur = Utilisateur.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                // Hachage du mot de passe avec BCrypt pour la sécurité
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .telephone(request.getTelephone())
                .role(request.getRole())
                .statut(StatutUtilisateur.ACTIF)
                .build();

        // 3. Sauvegarder en base de données PostgreSQL
        Utilisateur userSauvegarde = utilisateurRepository.save(utilisateur);

        // 4. Générer un token de session et retourner les données de profil
        String token = genererTokenSession(userSauvegarde);
        
        return mappingToAuthResponse(userSauvegarde, token);
    }

    @Override
    public AuthResponse connecter(ConnexionRequest request) {
        // 1. Chercher l'utilisateur par son email
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect."));

        // 2. Vérifier si l'utilisateur est bloqué par l'administrateur
        if (utilisateur.getStatut() == StatutUtilisateur.BLOQUE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Votre compte a été bloqué par l'administrateur.");
        }

        // 3. Vérifier la validité du mot de passe
        if (!passwordEncoder.matches(request.getMotDePasse(), utilisateur.getMotDePasse())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect.");
        }

        // 4. Générer le token de session
        String token = genererTokenSession(utilisateur);

        return mappingToAuthResponse(utilisateur, token);
    }

    // Générateur de token sécurisé
    private String genererTokenSession(Utilisateur utilisateur) {
        // Dans une implémentation finale de production, on utilisera une bibliothèque JWT (ex: io.jsonwebtoken)
        // Ici, nous générons un jeton sécurisé unique basé sur l'identifiant pour la démonstration
        return "session_token_" + UUID.randomUUID().toString().replace("-", "") + "_" + utilisateur.getId();
    }

    // Mapper l'entité vers le DTO de réponse
    private AuthResponse mappingToAuthResponse(Utilisateur user, String token) {
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .role(user.getRole())
                .statut(user.getStatut())
                .build();
    }
}
