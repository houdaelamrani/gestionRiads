package com.pfa.riad.dto;

import com.pfa.riad.enums.Role;
import com.pfa.riad.enums.StatutUtilisateur;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token; // Token d'authentification (ex: JWT ou session mockée)
    private UUID id;
    private String nom;
    private String prenom;
    private String email;
    private Role role;
    private StatutUtilisateur statut;
}
