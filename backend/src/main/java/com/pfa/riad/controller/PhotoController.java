package com.pfa.riad.controller;

import com.pfa.riad.entity.Photo;
import com.pfa.riad.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class PhotoController {

    private final PhotoService photoService;

    // 1. Uploader une photo pour un Riad (Propriétaire)
    @PostMapping(value = "/api/riads/{riadId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Photo> ajouterPhotoRiad(
            @RequestParam("file") MultipartFile file,
            @PathVariable UUID riadId,
            @RequestHeader("X-User-Id") UUID proprietaireId) {
        Photo photo = photoService.ajouterPhotoRiad(file, riadId, proprietaireId);
        return new ResponseEntity<>(photo, HttpStatus.CREATED);
    }

    // 2. Uploader une photo pour une Chambre (Propriétaire)
    @PostMapping(value = "/api/chambres/{chambreId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Photo> ajouterPhotoChambre(
            @RequestParam("file") MultipartFile file,
            @PathVariable UUID chambreId,
            @RequestHeader("X-User-Id") UUID proprietaireId) {
        Photo photo = photoService.ajouterPhotoChambre(file, chambreId, proprietaireId);
        return new ResponseEntity<>(photo, HttpStatus.CREATED);
    }

    // 3. Récupérer toutes les photos d'un Riad (Public)
    @GetMapping("/api/riads/{riadId}/photos")
    public ResponseEntity<List<Photo>> obtenirPhotosRiad(@PathVariable UUID riadId) {
        List<Photo> photos = photoService.obtenirPhotosRiad(riadId);
        return ResponseEntity.ok(photos);
    }

    // 4. Récupérer toutes les photos d'une Chambre (Public)
    @GetMapping("/api/chambres/{chambreId}/photos")
    public ResponseEntity<List<Photo>> obtenirPhotosChambre(@PathVariable UUID chambreId) {
        List<Photo> photos = photoService.obtenirPhotosChambre(chambreId);
        return ResponseEntity.ok(photos);
    }

    // 5. Supprimer une photo (Propriétaire)
    @DeleteMapping("/api/photos/{photoId}")
    public ResponseEntity<Void> supprimerPhoto(
            @PathVariable UUID photoId,
            @RequestHeader("X-User-Id") UUID proprietaireId) {
        photoService.supprimerPhoto(photoId, proprietaireId);
        return ResponseEntity.noContent().build();
    }
}
