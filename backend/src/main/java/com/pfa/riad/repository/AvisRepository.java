package com.pfa.riad.repository;

import com.pfa.riad.entity.Avis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AvisRepository extends JpaRepository<Avis, UUID> {

    // Trouver tous les avis laissés sur un Riad
    List<Avis> findByRiadIdOrderByDateCreationDesc(UUID riadId);
}
