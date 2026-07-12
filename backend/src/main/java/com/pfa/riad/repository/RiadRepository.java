package com.pfa.riad.repository;

import com.pfa.riad.entity.Riad;
import com.pfa.riad.enums.StatutValidation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RiadRepository extends JpaRepository<Riad, UUID> {

    // Trouver tous les riads d'un propriétaire spécifique
    List<Riad> findByProprietaireId(UUID proprietaireId);

    // Trouver tous les riads d'une ville spécifique ayant un statut de validation donné
    List<Riad> findByVilleAndStatutValidation(String ville, StatutValidation statutValidation);

    // Trouver tous les riads selon leur statut de validation (ex: EN_ATTENTE pour l'admin)
    List<Riad> findByStatutValidation(StatutValidation statutValidation);
}
