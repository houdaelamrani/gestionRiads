package com.pfa.riad.controller;

import com.pfa.riad.dto.AvisRequest;
import com.pfa.riad.entity.Avis;
import com.pfa.riad.service.AvisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AvisController {

    private final AvisService avisService;

    // 1. Soumettre un avis (Client)
    @PostMapping("/api/avis")
    public ResponseEntity<Avis> laisserAvis(
            @Valid @RequestBody AvisRequest request,
            @RequestHeader("X-User-Id") UUID clientId) {
        Avis avis = avisService.laisserAvis(request, clientId);
        return new ResponseEntity<>(avis, HttpStatus.CREATED);
    }

    // 2. Récupérer les avis d'un Riad (Public)
    @GetMapping("/api/riads/{riadId}/avis")
    public ResponseEntity<List<Avis>> obtenirAvisRiad(@PathVariable UUID riadId) {
        List<Avis> avisList = avisService.obtenirAvisRiad(riadId);
        return ResponseEntity.ok(avisList);
    }
}
