package com.pfa.riad.service;

import com.pfa.riad.dto.AvisRequest;
import com.pfa.riad.entity.Avis;
import com.pfa.riad.entity.Riad;
import com.pfa.riad.entity.Utilisateur;
import com.pfa.riad.repository.AvisRepository;
import com.pfa.riad.repository.RiadRepository;
import com.pfa.riad.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvisServiceImpl implements AvisService {

    private final AvisRepository avisRepository;
    private final RiadRepository riadRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Override
    @Transactional
    public Avis laisserAvis(AvisRequest request, UUID clientId) {
        // 1. Récupérer le client
        Utilisateur client = utilisateurRepository.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client non trouvé."));

        // 2. Récupérer le Riad
        Riad riad = riadRepository.findById(request.getRiadId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Riad non trouvé."));

        // 3. Créer l'avis
        Avis avis = Avis.builder()
                .client(client)
                .riad(riad)
                .note(request.getNote())
                .commentaire(request.getCommentaire())
                .build();

        return avisRepository.save(avis);
    }

    @Override
    public List<Avis> obtenirAvisRiad(UUID riadId) {
        return avisRepository.findByRiadIdOrderByDateCreationDesc(riadId);
    }
}
