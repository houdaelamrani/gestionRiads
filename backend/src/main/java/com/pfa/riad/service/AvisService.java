package com.pfa.riad.service;

import com.pfa.riad.dto.AvisRequest;
import com.pfa.riad.entity.Avis;

import java.util.List;
import java.util.UUID;

public interface AvisService {

    // Soumettre un avis pour un Riad (Client)
    Avis laisserAvis(AvisRequest request, UUID clientId);

    // Lister tous les avis d'un Riad (Public)
    List<Avis> obtenirAvisRiad(UUID riadId);
}
