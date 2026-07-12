package com.pfa.riad.repository;

import com.pfa.riad.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, UUID> {

    // Trouver toutes les photos associées à un Riad
    List<Photo> findByRiadId(UUID riadId);

    // Trouver toutes les photos associées à une chambre
    List<Photo> findByChambreId(UUID chambreId);
}
