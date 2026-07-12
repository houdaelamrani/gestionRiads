package com.pfa.riad.service;

import com.pfa.riad.entity.Photo;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface PhotoService {

    // Uploader et enregistrer une photo pour un Riad
    Photo ajouterPhotoRiad(MultipartFile file, UUID riadId, UUID proprietaireId);

    // Uploader et enregistrer une photo pour une Chambre
    Photo ajouterPhotoChambre(MultipartFile file, UUID chambreId, UUID proprietaireId);

    // Récupérer toutes les photos d'un Riad
    List<Photo> obtenirPhotosRiad(UUID riadId);

    // Récupérer toutes les photos d'une Chambre
    List<Photo> obtenirPhotosChambre(UUID chambreId);

    // Supprimer une photo (de la base et de Cloudinary)
    void supprimerPhoto(UUID photoId, UUID proprietaireId);
}
