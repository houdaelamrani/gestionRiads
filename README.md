# 🏰 MoroccoRiads - Plateforme de Gestion et Réservation de Riads

> **Projet de Fin d'Année (PFA)**  
> **Réalisé par :** Houda El Amrani  
> **Technologies :** Next.js 16 (React 19), Spring Boot 3, PostgreSQL 15, Spring Security, Cloudinary

---

## 🌟 Présentation du Projet

**MoroccoRiads** est une solution web complète dédiée à l'hôtellerie traditionnelle marocaine (Riads). Elle permet de connecter les voyageurs en quête d'expériences authentiques avec les propriétaires d'établissements à travers tout le Royaume (Marrakech, Fès, Essaouira, etc.).

La plateforme offre trois espaces totalement cloisonnés et adaptés à chaque profil d'utilisateur :

1. 👤 **Espace Client (Voyageur)** : Recherche avancée par ville, dates et budget, consultation des détails (chambres, services, équipements), réservation en ligne et dépôt d'avis authentifiés.
2. 🏨 **Espace Propriétaire (Hébergeur)** : Tableau de bord de pilotage, gestion des établissements et des chambres/suites, suivi des demandes de réservation avec acceptation/refus en temps réel, et galerie photo Cloudinary.
3. 👨‍💼 **Espace Administrateur** : Supervision globale de la plateforme, validation des nouveaux hébergements et modération des comptes utilisateurs.

---

## 🏗️ Architecture Technique

### 1. Frontend (Next.js & React)
* **Framework** : Next.js 16 avec App Router (`src/app/`).
* **Design & UI** : Interface moderne et responsive inspirée de l'esthétique marocaine (Terracotta, Bleu Majorelle, Zellige).
* **Internationalisation** : Support multilingue (Français / Anglais).
* **Sécurité & Sessions** : Gestion de session utilisateur avec redirection par rôle (`CLIENT`, `PROPRIETAIRE`, `ADMIN`).

### 2. Backend (Spring Boot 3)
* **Framework** : Spring Boot 3.3 (Java 17/23).
* **Sécurité** : Spring Security avec hachage BCrypt des mots de passe.
* **Persistance** : Spring Data JPA & Hibernate avec PostgreSQL 15.
* **Médias** : Intégration de l'API Cloudinary pour l'hébergement et l'optimisation des photographies.
* **API REST** : Contrôleurs modulaires documentés avec gestion des statuts HTTP et validation DTO.

### 3. Base de Données (PostgreSQL 15)
* Schéma relationnel optimisé avec clés étrangères, contraintes de vérification et intégrité référentielle en cascade (`CASCADE`).
* Tables principales : `utilisateurs`, `riads`, `chambres`, `photos`, `reservations`, `reservation_chambres`, `avis`, `paiements`.

---

## 🚀 Installation et Lancement

### Prérequis
* Java JDK 17+ (ou JDK 23)
* Apache Maven 3.9+
* Node.js 18+ et npm
* PostgreSQL 15

### 1. Base de Données
Créez la base de données nommée `riad_db` dans PostgreSQL puis exécutez les scripts :
```bash
# Exécution du schéma et des données initiales
psql -U postgres -d riad_db -f database/schema.sql
psql -U postgres -d riad_db -f database/data.sql
```

### 2. Démarrage du Backend
```bash
cd backend
mvn spring-boot:run
```
*Le serveur démarrera sur `http://localhost:8080`.*

### 3. Démarrage du Frontend
```bash
cd frontend
npm install
npm run dev
```
*L'application sera accessible sur `http://localhost:3000`.*

---

## 🔑 Comptes de Démonstration

| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Administrateur** | `admin@riad.ma` | `password123` |
| **Propriétaire** | `proprietaire@riad.ma` | `password123` |
| **Client** | `client1@riad.ma` | `password123` |

---

## 👩‍💻 Auteur

* **Houda El Amrani**