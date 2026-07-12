package com.pfa.riad.repository;

import com.pfa.riad.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, UUID> {

    // Trouver un utilisateur par son adresse email
    Optional<Utilisateur> findByEmail(String email);

    // Vérifier si un email existe déjà en base de données
    Boolean existsByEmail(String email);
}
