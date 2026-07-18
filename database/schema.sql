-- Script de création de la base de données Riad Maroc
-- Système de gestion des Riads (Clients, Propriétaires, Administrateurs)

-- Activer l'extension pgcrypto pour la génération d'UUID si nécessaire (facultatif sur PostgreSQL récent, mais recommandé)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Suppression des tables existantes pour repartir à zéro (en respectant l'ordre des contraintes de clés étrangères)
DROP TABLE IF EXISTS avis CASCADE;
DROP TABLE IF EXISTS paiements CASCADE;
DROP TABLE IF EXISTS reservation_chambres CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS chambres CASCADE;
DROP TABLE IF EXISTS riads CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;

-- 1. Table Utilisateurs
CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL, -- Sera hashé par Spring Security (ex: BCrypt)
    telephone VARCHAR(20),
    role VARCHAR(20) NOT NULL CONSTRAINT chk_role CHECK (role IN ('CLIENT', 'PROPRIETAIRE', 'ADMIN')),
    statut VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CONSTRAINT chk_statut CHECK (statut IN ('ACTIF', 'BLOQUE')),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Riads
CREATE TABLE riads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    adresse TEXT NOT NULL,
    ville VARCHAR(100) NOT NULL, -- Permet le filtrage rapide par ville
    proprietaire_id UUID NOT NULL,
    statut_validation VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE' CONSTRAINT chk_validation CHECK (statut_validation IN ('EN_ATTENTE', 'VALIDE', 'REJETE')),
    prix_riad_entier DECIMAL(10, 2) DEFAULT NULL, -- Tarif spécial si loué en entier (optionnel)
    has_spa BOOLEAN DEFAULT FALSE,
    has_traiteur BOOLEAN DEFAULT FALSE,
    has_hammam BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_riad_proprietaire FOREIGN KEY (proprietaire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- 3. Table Chambres
CREATE TABLE chambres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    riad_id UUID NOT NULL,
    nom_chambre VARCHAR(100) NOT NULL, -- Ex: "Chambre Atlas", "Suite Jasmine"
    type_chambre VARCHAR(50) NOT NULL CONSTRAINT chk_type_chambre CHECK (type_chambre IN ('SINGLE', 'DOUBLE', 'TRIPLE', 'SUITE')),
    description TEXT,
    prix_par_nuit DECIMAL(10, 2) NOT NULL CONSTRAINT chk_prix CHECK (prix_par_nuit > 0),
    capacite INT NOT NULL CONSTRAINT chk_capacite CHECK (capacite > 0),
    disponible BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT fk_chambre_riad FOREIGN KEY (riad_id) REFERENCES riads(id) ON DELETE CASCADE
);

-- 4. Table Photos (Hébergées sur Cloudinary, nous stockons l'URL)
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    riad_id UUID,
    chambre_id UUID,
    
    CONSTRAINT fk_photo_riad FOREIGN KEY (riad_id) REFERENCES riads(id) ON DELETE CASCADE,
    CONSTRAINT fk_photo_chambre FOREIGN KEY (chambre_id) REFERENCES chambres(id) ON DELETE CASCADE,
    -- Une photo doit être liée à au moins un Riad ou une Chambre
    CONSTRAINT chk_photo_cible CHECK (riad_id IS NOT NULL OR chambre_id IS NOT NULL)
);

-- 5. Table Réservations
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID,
    riad_id UUID NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    prix_total DECIMAL(10, 2) NOT NULL CONSTRAINT chk_prix_total CHECK (prix_total >= 0),
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE' CONSTRAINT chk_statut_res CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'ANNULEE')),
    riad_entier BOOLEAN DEFAULT FALSE, -- Vrai si tout le Riad a été loué
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_res_client FOREIGN KEY (client_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    CONSTRAINT fk_res_riad FOREIGN KEY (riad_id) REFERENCES riads(id) ON DELETE CASCADE,
    -- La date de fin doit être strictement après la date de début
    CONSTRAINT chk_dates CHECK (date_fin > date_debut)
);

-- 6. Table d'association Réservations-Chambres (Gestion du multi-chambre)
CREATE TABLE reservation_chambres (
    reservation_id UUID NOT NULL,
    chambre_id UUID NOT NULL,
    
    PRIMARY KEY (reservation_id, chambre_id),
    CONSTRAINT fk_assoc_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    CONSTRAINT fk_assoc_chambre FOREIGN KEY (chambre_id) REFERENCES chambres(id) ON DELETE CASCADE
);

-- 7. Table Paiements
CREATE TABLE paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL,
    montant DECIMAL(10, 2) NOT NULL CONSTRAINT chk_montant CHECK (montant >= 0),
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    methode_paiement VARCHAR(50) NOT NULL CONSTRAINT chk_methode CHECK (methode_paiement IN ('CARTE_BANCAIRE', 'PAYPAL', 'SUR_PLACE')),
    statut_paiement VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE' CONSTRAINT chk_statut_paiement CHECK (statut_paiement IN ('EN_ATTENTE', 'REUSSI', 'ECHOUE')),
    
    CONSTRAINT fk_paiement_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- 8. Table Avis
CREATE TABLE avis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID,
    riad_id UUID NOT NULL,
    note INT NOT NULL CONSTRAINT chk_note CHECK (note >= 1 AND note <= 5),
    commentaire TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_avis_client FOREIGN KEY (client_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    CONSTRAINT fk_avis_riad FOREIGN KEY (riad_id) REFERENCES riads(id) ON DELETE CASCADE
);
