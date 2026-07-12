package com.pfa.riad.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.pfa.riad.entity.Chambre;
import com.pfa.riad.entity.Photo;
import com.pfa.riad.entity.Riad;
import com.pfa.riad.repository.ChambreRepository;
import com.pfa.riad.repository.PhotoRepository;
import com.pfa.riad.repository.RiadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PhotoServiceImpl implements PhotoService {

    private final PhotoRepository photoRepository;
    private final RiadRepository riadRepository;
    private final ChambreRepository chambreRepository;
    private final Cloudinary cloudinary;

    @Override
    public Photo ajouterPhotoRiad(MultipartFile file, UUID riadId, UUID proprietaireId) {
        // 1. Récupérer et vérifier le Riad
        Riad riad = riadRepository.findById(riadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Riad non trouvé."));

        // 2. Vérifier la propriété
        if (!riad.getProprietaire().getId().equals(proprietaireId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé. Ce Riad ne vous appartient pas.");
        }

        // 3. Uploader le fichier sur Cloudinary
        String imageUrl = uploaderSurCloudinary(file);

        // 4. Enregistrer la photo en base de données
        Photo photo = Photo.builder()
                .url(imageUrl)
                .riad(riad)
                .chambre(null)
                .build();

        return photoRepository.save(photo);
    }

    @Override
    public Photo ajouterPhotoChambre(MultipartFile file, UUID chambreId, UUID proprietaireId) {
        // 1. Récupérer et vérifier la Chambre
        Chambre chambre = chambreRepository.findById(chambreId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chambre non trouvée."));

        // 2. Vérifier la propriété (via le riad parent)
        if (!chambre.getRiad().getProprietaire().getId().equals(proprietaireId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé. Ce Riad ne vous appartient pas.");
        }

        // 3. Uploader le fichier sur Cloudinary
        String imageUrl = uploaderSurCloudinary(file);

        // 4. Enregistrer la photo en base de données
        Photo photo = Photo.builder()
                .url(imageUrl)
                .riad(null)
                .chambre(chambre)
                .build();

        return photoRepository.save(photo);
    }

    @Override
    public List<Photo> obtenirPhotosRiad(UUID riadId) {
        return photoRepository.findByRiadId(riadId);
    }

    @Override
    public List<Photo> obtenirPhotosChambre(UUID chambreId) {
        return photoRepository.findByChambreId(chambreId);
    }

    @Override
    public void supprimerPhoto(UUID photoId, UUID proprietaireId) {
        // 1. Récupérer la photo
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo non trouvée."));

        // 2. Vérifier les permissions
        boolean estAutorise = false;
        if (photo.getRiad() != null) {
            estAutorise = photo.getRiad().getProprietaire().getId().equals(proprietaireId);
        } else if (photo.getChambre() != null) {
            estAutorise = photo.getChambre().getRiad().getProprietaire().getId().equals(proprietaireId);
        }

        if (!estAutorise) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé. Vous n'êtes pas le propriétaire de ce Riad.");
        }

        // 3. Supprimer de la base de données (Note : pour Cloudinary, on pourrait aussi détruire via cloudinary.uploader().destroy(...))
        photoRepository.delete(photo);
    }

    // Méthode utilitaire d'upload
    private String uploaderSurCloudinary(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le fichier envoyé est vide.");
        }
        try {
            // Envoyer les octets de l'image à Cloudinary
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            // Retourner l'URL sécurisée HTTPS générée par Cloudinary
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur de communication avec le serveur Cloudinary.");
        }
    }
}
