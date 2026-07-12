package com.pfa.riad.repository;

import com.pfa.riad.entity.Chambre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChambreRepository extends JpaRepository<Chambre, UUID> {

    // Trouver toutes les chambres appartenant à un Riad spécifique
    List<Chambre> findByRiadId(UUID riadId);
}
