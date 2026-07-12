# Suivi des Tâches - Riad Maroc

## Base de Données (Terminé)
- [x] Créer le dossier `database/` sur le disque D: (`d:/pfa1.0.0/database`)
- [x] Créer le fichier `schema.sql` avec les définitions des tables et contraintes
- [x] Créer le fichier `data.sql` avec les données de test

## Structure de Base (Terminé)
- [x] Initialiser le projet backend Spring Boot (`d:/pfa1.0.0/backend/`)
- [x] Créer le fichier `pom.xml` avec les dépendances
- [x] Configurer `application.properties` pour la base de données PostgreSQL
- [x] Créer la classe principale `RiadApplication.java`
- [x] Créer les entités JPA de base correspondant au schéma SQL (User, Riad, Chambre, Reservation, etc.)
- [x] Initialiser le projet frontend Next.js dans `d:/pfa1.0.0/frontend/`
- [x] Configurer Next.js et créer la page d'accueil d'inspiration marocaine

## Authentification & Inscription (Terminé)
- [x] Ajouter la dépendance Spring Security dans `pom.xml` pour le hachage des mots de passe
- [x] Créer la classe de configuration `SecurityConfig.java` pour autoriser les endpoints publics
- [x] Créer l'interface de dépôt `UtilisateurRepository.java` pour communiquer avec la base
- [x] Créer les DTOs `InscriptionRequest.java`, `ConnexionRequest.java` et `AuthResponse.java`
- [x] Implémenter le service métier `AuthService.java` et `AuthServiceImpl.java` avec hachage BCrypt
- [x] Créer le contrôleur REST `AuthController.java` avec gestion CORS pour Next.js (port 3000)
- [x] Ajouter les styles CSS pour les formulaires d'authentification dans `globals.css`
- [x] Créer la page de connexion interactive `login/page.js`
- [x] Créer la page d'inscription interactive `register/page.js`
- [x] Mettre à jour la navigation globale dans `page.js` pour gérer l'affichage de la session

## Gestion des Riads & Chambres par Propriétaire (Terminé)
- [x] Créer les interfaces de dépôt `RiadRepository.java` et `ChambreRepository.java`
- [x] Créer les DTOs `RiadRequest.java` et `ChambreRequest.java`
- [x] Implémenter les services métiers `RiadService.java`/`RiadServiceImpl.java` et `ChambreService.java`/`ChambreServiceImpl.java`
- [x] Créer les contrôleurs REST `RiadController.java` et `ChambreController.java` pour gérer l'ajout et l'affichage par propriétaire
- [x] Ajouter les styles CSS pour le tableau de bord propriétaire dans `globals.css`
- [x] Créer l'interface de tableau de bord `dashboard/page.js` intégrant l'ajout de Riads et de Chambres en modal, et le contrôle de disponibilité
- [x] Relier le lien d'accès au tableau de bord dans l'en-tête de la page d'accueil pour les hébergeurs connectés

## Système d'Upload de Photos avec Cloudinary (Terminé)
- [x] Ajouter la dépendance du SDK Cloudinary (`cloudinary-http44`) dans `pom.xml`
- [x] Configurer les clés d'API et les limites d'upload de fichiers dans `application.properties`
- [x] Créer la classe de configuration du Bean Cloudinary `CloudinaryConfig.java`
- [x] Créer l'interface de dépôt `PhotoRepository.java` pour interagir avec la table photos
- [x] Implémenter le service métier `PhotoService.java` / `PhotoServiceImpl.java` effectuant l'upload binaire et les contrôles de propriété
- [x] Créer le contrôleur REST `PhotoController.java` exposant les endpoints d'upload Multipart pour Riads et Chambres
- [x] **Intégrer l'upload de photos dans le dashboard propriétaire** (galerie, suppression, upload chambre)

## Système de Réservation (Terminé)
- [x] Créer les DTOs `ReservationRequest.java` pour les données de réservation
- [x] Implémenter le service `ReservationServiceImpl.java` (calcul prix, multi-chambre, riad entier, paiement)
- [x] Créer le contrôleur REST `ReservationController.java` (création, liste client, liste propriétaire, statut, annulation)
- [x] Créer l'espace client `client/page.js` avec catalogue, modal de réservation, et liste des réservations
- [x] **Ajouter les boutons Confirmer/Refuser dans le dashboard propriétaire**

## Système d'Avis (Terminé)
- [x] Créer le DTO `AvisRequest.java` et l'entité `Avis.java`
- [x] Implémenter le service `AvisServiceImpl.java` et le contrôleur `AvisController.java`
- [x] **Intégrer le système d'avis dans l'espace client** (bouton "Laisser un avis", formulaire modal étoiles, affichage avis et note moyenne dans le catalogue)

## Espace Admin (Terminé)
- [x] Implémenter le service `UtilisateurServiceImpl.java` et le contrôleur `UtilisateurController.java`
- [x] Créer l'interface admin `admin/page.js` avec validation riads, gestion utilisateurs, statistiques

## Page d'Accueil — Intégration API Réelle (Terminé)
- [x] **Remplacer les données mockées par des appels API réels** (GET /api/riads/recherche)
- [x] **Afficher les photos Cloudinary et notes/avis dans les cartes de riads**
- [x] **Maintenir le filtre par ville fonctionnel avec l'API**
