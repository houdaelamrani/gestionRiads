package com.pfa.riad.service;

import com.pfa.riad.dto.AuthResponse;
import com.pfa.riad.dto.ConnexionRequest;
import com.pfa.riad.dto.InscriptionRequest;

public interface AuthService {
    
    // Inscrire un nouvel utilisateur (Client ou Propriétaire)
    AuthResponse inscrire(InscriptionRequest request);
    
    // Connecter un utilisateur existant
    AuthResponse connecter(ConnexionRequest request);
}
