package com.pfa.riad.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.List;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.pfa.riad.repository.RiadRepository;
import com.pfa.riad.entity.Riad;
import com.pfa.riad.enums.StatutValidation;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ChatController {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Autowired
    private RiadRepository riadRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("response", "Message vide."));
        }

        // Récupérer la liste des Riads validés pour le contexte
        List<Riad> riads = java.util.Collections.emptyList();
        try {
            riads = riadRepository.findByStatutValidation(StatutValidation.VALIDE);
        } catch (Exception ignored) {}

        StringBuilder riadsContext = new StringBuilder();
        riadsContext.append("Voici la liste des Riads actuellement disponibles et validés sur notre plateforme MoroccoRiads :\n");
        for (Riad r : riads) {
            riadsContext.append(String.format("- Riad %s à %s (Prix indicatif pour le riad entier: %s MAD/nuit, Adresse: %s. Options - Spa: %s, Hammam: %s, Traiteur: %s)\n",
                    r.getNom(), r.getVille(), r.getPrixRiadEntier() != null ? r.getPrixRiadEntier() : "N/A", r.getAdresse(),
                    r.getHasSpa() ? "Oui" : "Non",
                    r.getHasHammam() ? "Oui" : "Non",
                    r.getHasTraiteur() ? "Oui" : "Non"));
        }
        riadsContext.append("\n");

        // Si la clé API n'est pas configurée, on renvoie une réponse locale simulée enrichie avec les données de la DB
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("VOTRE_CLE_API_GEMINI_ICI")) {
            return ResponseEntity.ok(Map.of("response", generateFallbackResponse(userMessage, riads)));
        }

        try {
            String systemPrompt = "Tu es Yasmine, l'assistante virtuelle attentionnée et chaleureuse de la plateforme MoroccoRiads. " +
                    "Ton rôle principal est d'aider les voyageurs à planifier leur séjour et répondre à leurs questions. " +
                    "Tu dois répondre à TOUTES les questions de l'utilisateur, quel que soit le sujet (conversation générale, conseils de voyage au Maroc, salutations, questions diverses ou plaisanteries), " +
                    "de manière polie, chaleureuse et serviable, dans la même langue que l'utilisateur (français ou anglais). " +
                    "Voici des informations sur les Riads réels disponibles sur notre plateforme pour t'aider s'il pose des questions sur les hébergements :\n" +
                    riadsContext.toString() +
                    "Voici le message de l'utilisateur : ";

            String requestBody = objectMapper.writeValueAsString(Map.of(
                "contents", new Object[]{
                    Map.of("parts", new Object[]{
                        Map.of("text", systemPrompt + userMessage)
                    })
                }
            ));

            String uriString = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(uriString))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (httpResponse.statusCode() == 200) {
                JsonNode rootNode = objectMapper.readTree(httpResponse.body());
                JsonNode textNode = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text");
                String responseText = textNode.asText();
                return ResponseEntity.ok(Map.of("response", responseText));
            } else {
                return ResponseEntity.ok(Map.of("response", generateFallbackResponse(userMessage, riads)));
            }

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("response", generateFallbackResponse(userMessage, riads)));
        }
    }

    private String generateFallbackResponse(String message, List<Riad> riads) {
        String msg = message.toLowerCase();
        
        // Version anglaise si le message ressemble à de l'anglais
        boolean isEnglish = msg.contains("hello") || msg.contains("hi") || msg.contains("price") || msg.contains("book") || msg.contains("cancel") || msg.contains("room") || msg.contains("thank");
        
        if (isEnglish) {
            if (msg.contains("hello") || msg.contains("hi") || msg.contains("hey")) {
                return "Hello! How can I help you today? I am ready to answer any questions you have!";
            }
            if (msg.contains("thank") || msg.contains("thanks")) {
                return "You are very welcome! Let me know if you need anything else.";
            }
            if (msg.contains("how are you")) {
                return "I'm doing great, thank you for asking! How can I assist you today?";
            }
            if (msg.contains("list") || msg.contains("riad") || msg.contains("show") || msg.contains("what") || msg.contains("have")) {
                if (riads != null && !riads.isEmpty()) {
                    StringBuilder sb = new StringBuilder("We have several wonderful Riads available: ");
                    for (int i = 0; i < riads.size(); i++) {
                        sb.append("Riad ").append(riads.get(i).getNom()).append(" in ").append(riads.get(i).getVille());
                        if (i < riads.size() - 1) sb.append(", ");
                    }
                    sb.append(". You can check their details and book directly from our catalogue page!");
                    return sb.toString();
                }
            }
            if (msg.contains("price") || msg.contains("cost") || msg.contains("how much")) {
                return "Our riads start from 400 MAD per night. You can book an individual room or privatize the entire riad for exclusive events!";
            } else if (msg.contains("cancel")) {
                return "You can easily cancel your reservation from your dashboard (My Reservations) if it is still pending validation. No fees apply!";
            } else if (msg.contains("spa") || msg.contains("hammam") || msg.contains("massage")) {
                return "Most of our riads feature a traditional Hammam and Spa. We offer massages with organic argan oil and local black soap scrubs.";
            } else if (msg.contains("food") || msg.contains("dinner") || msg.contains("breakfast")) {
                return "Moroccan breakfast is included with your stay! For dinner, our chef can prepare authentic tajines, couscous or pastillas upon request.";
            }
            return "I am here to answer any questions you have! If you want to know about our Riads, bookings, or local travel tips, feel free to ask.";
        } else {
            // Version française par défaut
            if (msg.contains("bonjour") || msg.contains("salut") || msg.contains("coucou") || msg.contains("bonsoir")) {
                return "Bonjour ! Comment puis-je vous aider aujourd'hui ? Je suis à votre disposition pour répondre à toutes vos questions !";
            }
            if (msg.contains("merci") || msg.contains("super") || msg.contains("cool")) {
                return "Je vous en prie ! C'est un plaisir de vous aider. N'hésitez pas si vous avez d'autres questions.";
            }
            if (msg.contains("ça va") || msg.contains("comment vas-tu") || msg.contains("comment ca va")) {
                return "Je vais très bien, merci de demander ! Et vous, comment puis-je vous aider aujourd'hui ?";
            }
            if (msg.contains("liste") || msg.contains("riad") || msg.contains("quels") || msg.contains("proposez") || msg.contains("trouver")) {
                if (riads != null && !riads.isEmpty()) {
                    StringBuilder sb = new StringBuilder("Nous disposons de magnifiques Riads disponibles : ");
                    for (int i = 0; i < riads.size(); i++) {
                        sb.append("Riad ").append(riads.get(i).getNom()).append(" à ").append(riads.get(i).getVille());
                        if (i < riads.size() - 1) sb.append(", ");
                    }
                    sb.append(". Vous pouvez consulter leurs fiches et réserver directement depuis le catalogue !");
                    return sb.toString();
                }
            }
            if (msg.contains("prix") || msg.contains("tarif") || msg.contains("combien")) {
                return "Nos tarifs commencent à partir de 400 MAD par nuit. Vous pouvez louer une chambre individuelle ou privatiser un riad complet pour plus d'intimité !";
            } else if (msg.contains("annuler") || msg.contains("annulation")) {
                return "Vous pouvez annuler votre réservation gratuitement depuis votre espace client (Mes Réservations) tant qu'elle est en attente de validation.";
            } else if (msg.contains("spa") || msg.contains("hammam") || msg.contains("massage")) {
                return "La plupart de nos riads partenaires disposent d'un Hammam traditionnel et d'un espace Spa. Nous proposons des rituels au savon noir et des massages à l'huile d'argan bio.";
            } else if (msg.contains("repas") || msg.contains("manger") || msg.contains("dîner") || msg.contains("petit dejeuner") || msg.contains("cuisine")) {
                return "Le petit-déjeuner marocain traditionnel est inclus dans votre séjour ! Nos chefs locaux peuvent également préparer de délicieux tajines et couscous sur demande.";
            } else if (msg.contains("contact") || msg.contains("adresse") || msg.contains("téléphone")) {
                return "Vous pouvez nous contacter directement par email à support@moroccoriads.com ou appeler le riad de votre choix via son numéro disponible sur sa fiche.";
            }
            return "Je suis à votre disposition pour répondre à toutes vos questions ! Que ce soit sur les Riads, les séjours ou toute autre demande, n'hésitez pas.";
        }
    }
}
