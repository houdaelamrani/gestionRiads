package com.pfa.riad.controller;

import com.pfa.riad.dto.AuthResponse;
import com.pfa.riad.dto.ConnexionRequest;
import com.pfa.riad.dto.InscriptionRequest;
import com.pfa.riad.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}) // Autoriser le port par défaut de Next.js pour éviter les erreurs CORS
public class AuthController {

    private final AuthService authService;

    // Endpoint pour l'inscription d'un nouvel utilisateur (Client ou Propriétaire)
    @PostMapping("/inscription")
    public ResponseEntity<AuthResponse> inscrire(@Valid @RequestBody InscriptionRequest request) {
        AuthResponse response = authService.inscrire(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Endpoint pour la connexion (Authentification) d'un utilisateur
    @PostMapping("/connexion")
    public ResponseEntity<AuthResponse> connecter(@Valid @RequestBody ConnexionRequest request) {
        AuthResponse response = authService.connecter(request);
        return ResponseEntity.ok(response);
    }
}
