package com.pfa.riad.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    public void envoyerConfirmationReservation(String nomClient, String emailClient, String telephoneClient, String nomRiad, String dates) {
        // Simulation SMS
        String smsMessage = String.format("SMS pour %s (%s) : Votre réservation pour le %s (%s) est CONFIRMÉE ! Bon voyage. - MoroccoRiads",
                nomClient, telephoneClient != null ? telephoneClient : "N/A", nomRiad, dates);
        logger.info("[SIMULATION SMS] {}", smsMessage);
        System.out.println("[SMS SENT] " + smsMessage);

        // Simulation EMAIL
        String emailBody = String.format(
                "Bonjour %s,\n\n" +
                "Nous avons le plaisir de vous confirmer votre réservation pour le Riad : %s.\n" +
                "Dates du séjour : %s.\n\n" +
                "L'art de l'hospitalité marocaine vous attend au cœur de la médina.\n\n" +
                "Cordialement,\n" +
                "L'équipe MoroccoRiads",
                nomClient, nomRiad, dates
        );
        logger.info("[SIMULATION EMAIL] Destinataire: {}\nSujet: Confirmation de Réservation - MoroccoRiads\nCorps:\\n{}", emailClient, emailBody);
        System.out.println("[EMAIL SENT] To: " + emailClient + "\n" + emailBody);

        // Envoi de mail RÉEL si JavaMailSender est disponible
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                if (mailFrom != null && !mailFrom.trim().isEmpty()) {
                    message.setFrom("MoroccoRiads <" + mailFrom + ">");
                    message.setBcc(mailFrom);
                } else {
                    message.setFrom("booking@moroccoriads.com");
                }
                message.setTo(emailClient);
                message.setSubject("Confirmation de Réservation - MoroccoRiads");
                message.setText(emailBody);
                mailSender.send(message);
                logger.info("[MAIL RÉEL] Envoyé avec succès à {}", emailClient);
            } catch (Exception e) {
                logger.error("[MAIL RÉEL] Échec de l'envoi du mail réel à {} : {}", emailClient, e.getMessage());
            }
        } else {
            logger.warn("[MAIL RÉEL] Non envoyé car JavaMailSender n'est pas configuré.");
        }
    }

    public void envoyerRappelReservation(String nomClient, String emailClient, String nomRiad) {
        String emailBody = String.format(
                "Bonjour %s,\n\n" +
                "Nous vous rappelons que votre séjour au Riad : %s commence demain.\n" +
                "Les détails de votre accueil et l'assistance en direct sont disponibles dans votre espace client.\n\n" +
                "Bon voyage,\n" +
                "Le Concierge MoroccoRiads",
                nomClient, nomRiad
        );
        logger.info("[SIMULATION EMAIL RAPPEL] Destinataire: {}\nSujet: Rappel de Séjour - MoroccoRiads\nCorps:\\n{}", emailClient, emailBody);
        System.out.println("[EMAIL SENT RAPPEL] To: " + emailClient + "\n" + emailBody);

        // Envoi de mail RÉEL si JavaMailSender est disponible
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                if (mailFrom != null && !mailFrom.trim().isEmpty()) {
                    message.setFrom("MoroccoRiads <" + mailFrom + ">");
                    message.setBcc(mailFrom); // Copie pour l'administrateur (son propre mail)
                } else {
                    message.setFrom("concierge@moroccoriads.com");
                }
                message.setTo(emailClient);
                message.setSubject("Rappel de Séjour - MoroccoRiads");
                message.setText(emailBody);
                mailSender.send(message);
                logger.info("[MAIL RÉEL RAPPEL] Envoyé avec succès à {}", emailClient);
            } catch (Exception e) {
                logger.error("[MAIL RÉEL RAPPEL] Échec de l'envoi du mail réel à {} : {}", emailClient, e.getMessage());
            }
        } else {
            logger.warn("[MAIL RÉEL RAPPEL] Non envoyé car JavaMailSender n'est pas configuré.");
        }
    }

    public void envoyerNotificationPaiementSurPlace(String nomClient, String emailClient, String telephoneClient, String nomRiad, String dates, String dateDebut) {
        String smsMessage = String.format(
                "SMS pour %s (%s) : Réservation enregistrée pour %s (%s). IMPORTANT : Pour confirmer votre séjour, veuillez verser une avance ou venir avant le jour J (%s). À défaut, elle sera annulée le jour J. - MoroccoRiads",
                nomClient, telephoneClient != null ? telephoneClient : "N/A", nomRiad, dates, dateDebut
        );
        logger.info("[SIMULATION SMS SUR PLACE] {}", smsMessage);
        System.out.println("[SMS SENT SUR PLACE] " + smsMessage);

        String emailBody = String.format(
                "Bonjour %s,\n\n" +
                "Votre demande de réservation pour le Riad : %s (Dates : %s) a bien été enregistrée avec l'option « Paiement sur place ».\n\n" +
                "⚠️ INFORMATION IMPORTANTE POUR CONFIRMER VOTRE SÉJOUR :\n" +
                "Pour valider définitivement votre réservation, vous êtes prié(e) de verser une avance (acompte) ou de vous présenter à l'établissement avant le jour de votre arrivée (jour J : %s).\n" +
                "À défaut de versement de cette avance avant le jour J, votre réservation sera automatiquement annulée le jour même.\n\n" +
                "Nous restons à votre entière disposition pour tout renseignement complémentaire.\n\n" +
                "Cordialement,\n" +
                "L'équipe MoroccoRiads",
                nomClient, nomRiad, dates, dateDebut
        );
        logger.info("[SIMULATION EMAIL SUR PLACE] Destinataire: {}\nSujet: Confirmation requise (Avance) - MoroccoRiads\nCorps:\n{}", emailClient, emailBody);
        System.out.println("[EMAIL SENT SUR PLACE] To: " + emailClient + "\n" + emailBody);

        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                if (mailFrom != null && !mailFrom.trim().isEmpty()) {
                    message.setFrom("MoroccoRiads <" + mailFrom + ">");
                    message.setBcc(mailFrom);
                } else {
                    message.setFrom("booking@moroccoriads.com");
                }
                message.setTo(emailClient);
                message.setSubject("Confirmation requise (Avance) - MoroccoRiads");
                message.setText(emailBody);
                mailSender.send(message);
                logger.info("[MAIL RÉEL SUR PLACE] Envoyé avec succès à {}", emailClient);
            } catch (Exception e) {
                logger.error("[MAIL RÉEL SUR PLACE] Échec de l'envoi du mail réel à {} : {}", emailClient, e.getMessage());
            }
        }
    }

    public void envoyerConfirmationCheckIn(String nomClient, String emailClient, String telephoneClient, String nomRiad, String dates, String typePiece, String numeroPiece, String chambres) {
        String smsMessage = String.format(
                "SMS pour %s (%s) : Bienvenue au %s ! Votre Check-in a été validé avec succès (Pièce: %s %s). Chambre(s) : %s. Bon séjour ! - MoroccoRiads",
                nomClient, telephoneClient != null ? telephoneClient : "N/A", nomRiad, typePiece, numeroPiece, chambres != null ? chambres : "Assignée"
        );
        logger.info("[SIMULATION SMS CHECK-IN] {}", smsMessage);
        System.out.println("[SMS SENT CHECK-IN] " + smsMessage);

        String emailBody = String.format(
                "Bonjour %s,\n\n" +
                "Nous avons le plaisir de vous confirmer que votre enregistrement d'arrivée (Check-in) au « %s » a été validé avec succès !\n\n" +
                "📋 DÉTAILS DE VOTRE ENREGISTREMENT :\n" +
                "- Établissement : %s\n" +
                "- Dates du séjour : %s\n" +
                "- Hébergement : %s\n" +
                "- Document d'identité enregistré : %s n° %s\n" +
                "- Statut du séjour : En cours (Check-in validé)\n\n" +
                "Toute l'équipe du Riad vous souhaite un agréable et inoubliable séjour parmi nous.\n\n" +
                "Chaleureusement,\n" +
                "L'équipe %s & MoroccoRiads",
                nomClient, nomRiad, nomRiad, dates, chambres != null ? chambres : "Chambre(s) réservée(s)",
                typePiece != null ? typePiece : "Pièce d'identité", numeroPiece != null ? numeroPiece : "-", nomRiad
        );
        logger.info("[SIMULATION EMAIL CHECK-IN] Destinataire: {}\nSujet: Bienvenue ! Check-in validé au {}\nCorps:\n{}", emailClient, nomRiad, emailBody);
        System.out.println("[EMAIL SENT CHECK-IN] To: " + emailClient + "\n" + emailBody);

        if (mailSender != null && emailClient != null && !emailClient.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                if (mailFrom != null && !mailFrom.trim().isEmpty()) {
                    message.setFrom(nomRiad + " <" + mailFrom + ">");
                    message.setBcc(mailFrom);
                } else {
                    message.setFrom("welcome@moroccoriads.com");
                }
                message.setTo(emailClient);
                message.setSubject("✨ Bienvenue ! Check-in validé au " + nomRiad + " - MoroccoRiads");
                message.setText(emailBody);
                mailSender.send(message);
                logger.info("[MAIL RÉEL CHECK-IN] Envoyé avec succès à {}", emailClient);
            } catch (Exception e) {
                logger.error("[MAIL RÉEL CHECK-IN] Échec de l'envoi du mail réel à {} : {}", emailClient, e.getMessage());
            }
        }
    }
}
