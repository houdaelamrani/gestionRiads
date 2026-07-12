# Walkthrough - Structure Globale du Projet Riad Maroc

Ce document résume les composants mis en place pour l'application de gestion des Riads au Maroc. Tout le code a été généré sur le **disque D:** (`d:/pfa1.0.0/`).

---

## 📁 Structure du Projet Réorganisée (Routage par Rôle)

L'application Next.js est structurée en utilisant le routage imbriqué (*nested routing*) et des layouts de protection pour isoler de façon stricte les espaces de chaque type d'utilisateur.

```
d:/pfa1.0.0/
├── database/                   # Scripts PostgreSQL de création et de test
│   ├── schema.sql
│   └── data.sql
├── backend/                    # Code source Spring Boot (API REST & Persistance)
│   ├── pom.xml                 # Dépendances Maven (JPA, Web, Security, Cloudinary, PostgreSQL, Lombok)
│   └── src/main/
│       ├── java/com/pfa/riad/
│       │   ├── RiadApplication.java  # Classe principale de démarrage
│       │   ├── config/               # Sécurité, Cloudinary et Beans configurés
│       │   │   ├── SecurityConfig.java
│       │   │   └── CloudinaryConfig.java
│       │   ├── controller/           # Points d'entrée d'API (Controllers)
│       │   │   ├── AuthController.java
│       │   │   ├── RiadController.java
│       │   │   ├── ChambreController.java
│       │   │   ├── PhotoController.java
│       │   │   └── AvisController.java
│       │   ├── dto/                  # Data Transfer Objects
│       │   └── service/              # Services métier
│       └── resources/
│           └── application.properties # Configuration JDBC PostgreSQL, Hibernate & Cloudinary
└── frontend/                   # Interface Utilisateur Next.js 16 (App Router)
    ├── package.json
    └── src/app/
        ├── layout.js           # Layout global avec métadonnées optimisées
        ├── globals.css         # Design system premium (Terracotta, Majorelle, Or)
        ├── page.js             # Page d'accueil publique 100% orientée Client
        ├── login/
        │   └── page.js         # Page de connexion
        ├── register/
        │   └── page.js         # Page d'inscription
        │
        ├── client/             # 👤 ESPACE CLIENT (Isolé)
        │   ├── layout.js       # Navigation client & Protection d'accès
        │   ├── page.js         # Redirige vers /client/catalogue
        │   ├── catalogue/
        │   │   └── page.js     # Recherche, détails (avis + photos) et réservation
        │   └── reservations/
        │       └── page.js     # Liste des réservations, annulation et dépôt d'avis
        │
        ├── proprietaire/       # 🏨 ESPACE PROPRIÉTAIRE
        │   ├── layout.js       # Navigation propriétaire & Protection d'accès
        │   ├── page.js         # Redirige vers /proprietaire/riads
        │   ├── riads/
        │   │   └── page.js     # Gestion des Riads/Chambres et upload de photos Cloudinary
        │   └── reservations/
        │       └── page.js     # Confirmation et refus des réservations reçues
        │
        └── admin/              # 👨‍💼 ESPACE ADMINISTRATEUR
            ├── layout.js       # Navigation admin & Protection d'accès
            ├── page.js         # Redirige vers /admin/riads
            ├── riads/
            │   └── page.js     # Approbation et rejet des nouveaux riads
            ├── utilisateurs/
            │   └── page.js     # Activation et blocage des comptes
            └── stats/
                └── page.js     # KPIs de la plateforme et listes d'activité
```

---

## 🛠️ Composants et Isolation des Rôles

### 1. Base de Données (PostgreSQL 15)
* **[schema.sql](file:///d:/pfa1.0.0/database/schema.sql)** : Définit les tables et relations (utilisateurs, riads, chambres, photos, reservations, avis, paiements).
* **[data.sql](file:///d:/pfa1.0.0/database/data.sql)** : Alimente des données de démonstration cohérentes pour tester les différents profils.

### 🔑 2. Connexion & Redirection Intelligente
* Le contrôleur d'authentification REST **[AuthController.java](file:///d:/pfa1.0.0/backend/src/main/java/com/pfa/riad/controller/AuthController.java)** valide les mots de passe hachés avec BCrypt et renvoie le rôle.
* Le formulaire Next.js **[login/page.js](file:///d:/pfa1.0.0/frontend/src/app/login/page.js)** redirige l'utilisateur vers son espace dédié dès que la connexion réussit :
  * `CLIENT` ➡️ `/client` (puis `/client/catalogue`)
  * `PROPRIETAIRE` ➡️ `/proprietaire` (puis `/proprietaire/riads`)
  * `ADMIN` ➡️ `/admin` (puis `/admin/riads`)

### 👤 3. Isolation Client
L'espace client est totalement isolé et n'expose aucune information relative à l'existence d'autres espaces ou rôles (ni barre d'administration, ni simulateur multi-rôles, ni badge technique "CLIENT").
* **Recherche & Filtrage** : Le catalogue charge les riads validés via l'API REST `GET /api/riads/recherche` et filtre par ville au choix.
* **Paiement & Réservation** : Modale permettant de louer des suites spécifiques ou le riad entier avec calcul automatique des prix.
* **Avis & Notes** : Formulaire interactif 5 étoiles pour noter et commenter un séjour après confirmation de réservation.
* **Photos Cloudinary** : Intégration fluide de la galerie d'images hébergées dans le cloud gratuit.

### 🏨 4. Espace Propriétaire
* Gestion complète de l'inventaire en temps réel.
* **Upload d'images** : Permet d'uploader des photos de riads et de chambres via le SDK Cloudinary.
* **Réservations** : Les demandes reçues s'affichent avec des boutons clairs pour **Confirmer** ou **Refuser**.

### 👨‍💼 5. Espace Administrateur
* Validation en un clic des hébergements soumis par les propriétaires.
* Contrôle des comptes utilisateurs (possibilité de bloquer ou réactiver un utilisateur).
* Statistiques d'activité globales (taux de blocage, volume de riads en attente).

---

## 🚀 Comment lancer les applications ?

### Étape 1 : Démarrer PostgreSQL 15
Le serveur PostgreSQL doit écouter sur le port `5432` et contenir la base `riad_db`.

### Étape 2 : Lancer le Backend Spring Boot
Depuis le dossier `d:/pfa1.0.0/backend/` :
```bash
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25.0.2"
mvn spring-boot:run
```
*(Le serveur démarrera sur `http://localhost:8080`)*.

### Étape 3 : Lancer le Frontend Next.js
Depuis le dossier `d:/pfa1.0.0/frontend/` :
```bash
npm run dev
```
*(L'interface web sera disponible sur `http://localhost:3000`)*.
