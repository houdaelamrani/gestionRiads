-- Script d'insertion de données de test (data.sql)
-- Ce script pré-remplit la base de données avec des enregistrements de démonstration pour valider l'intégrité relationnelle.

-- Nettoyage préalable des tables
TRUNCATE TABLE avis, paiements, reservation_chambres, reservations, photos, chambres, riads, utilisateurs CASCADE;

-- 1. Insertion des Utilisateurs (Administrateur, Propriétaires par Ville, Clients)
INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, telephone, role, statut) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'El Amrani', 'houda', 'admin@riad.ma', '$2a$10$I6iTCGAezaNx600NvLLA8.uaMkLPHvKcl02Qlaxi0TiUdHuHolL9C', '+212600000001', 'ADMIN', 'ACTIF'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'El Amrani', 'Houda', 'proprietaire@riad.ma', '$2a$10$I6iTCGAezaNx600NvLLA8.uaMkLPHvKcl02Qlaxi0TiUdHuHolL9C', '+212600000002', 'PROPRIETAIRE', 'ACTIF'),
('76dedb51-3964-45a0-9e55-eddbf0fbed78', 'Elamrani', 'Houda', 'elamranihouda540@gmail.com', '$2a$10$I6iTCGAezaNx600NvLLA8.uaMkLPHvKcl02Qlaxi0TiUdHuHolL9C', '+212600000000', 'PROPRIETAIRE', 'ACTIF'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Tazi', 'Khadija', 'owner2@riad.ma', '$2a$10$I6iTCGAezaNx600NvLLA8.uaMkLPHvKcl02Qlaxi0TiUdHuHolL9C', '+212600000003', 'PROPRIETAIRE', 'ACTIF'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'Idrissi', 'Youssef', 'owner.fes@riad.ma', '$2a$10$I6iTCGAezaNx600NvLLA8.uaMkLPHvKcl02Qlaxi0TiUdHuHolL9C', '+212600000004', 'PROPRIETAIRE', 'ACTIF'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Dupont', 'Jean', 'client1@riad.ma', '$2a$10$I6iTCGAezaNx600NvLLA8.uaMkLPHvKcl02Qlaxi0TiUdHuHolL9C', '+33612345678', 'CLIENT', 'ACTIF'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Bennani', 'Salma', 'client2@riad.ma', '$2a$10$I6iTCGAezaNx600NvLLA8.uaMkLPHvKcl02Qlaxi0TiUdHuHolL9C', '+212611223344', 'CLIENT', 'ACTIF');

-- 2. Insertion des Riads (Séparés strictement par Propriétaire et par Ville)
INSERT INTO riads (id, nom, description, adresse, ville, proprietaire_id, statut_validation, prix_riad_entier, has_spa, has_traiteur, has_hammam) VALUES
-- Riads de Marrakech (Propriétaire Houda El Amrani - proprietaire@riad.ma)
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Riad Dar El Bacha', 'Un havre de paix au coeur de la médina de Marrakech avec piscine et toit terrasse.', '12 Rue Dar El Bacha, Médina', 'Marrakech', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'VALIDE', 2500.00, TRUE, TRUE, TRUE),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'Riad Cinnamon', 'Riad de charme raffiné, ancienne demeure de marchand d épices entièrement rénovée.', 'Derb el Kadi, Marrakech', 'Marrakech', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'VALIDE', 3000.00, TRUE, TRUE, FALSE),

-- Riads de Fès (Propriétaire Youssef Idrissi - owner.fes@riad.ma)
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Riad Fès Authentique', 'Riad traditionnel restauré avec zelliges historiques et patio ombragé.', '45 Derb el Miter, Fès El Bali', 'Fès', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'VALIDE', 1800.00, FALSE, TRUE, TRUE),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', 'Riad Souafine', 'Magnifique demeure historique nichée sur les hauteurs de la médina de Fès.', '14 Derb Souafine, Fès', 'Fès', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'VALIDE', 2200.00, TRUE, TRUE, TRUE),

-- Riads d'Essaouira (Propriétaire Khadija Tazi - owner2@riad.ma)
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'Riad Mogador Wave', 'Riad vue sur mer, design moderne mélangé à l artisanat d Essaouira.', '8 Avenue de la Plage, Essaouira', 'Essaouira', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'VALIDE', 1200.00, TRUE, FALSE, TRUE),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Riad Baoussala', 'Demeure de charme et de sérénité au cœur d Essaouira.', 'Ghazoua, Essaouira', 'Essaouira', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'VALIDE', 1500.00, FALSE, TRUE, TRUE);

-- 3. Insertion des Chambres
INSERT INTO chambres (id, riad_id, nom_chambre, type_chambre, description, prix_par_nuit, capacite, disponible) VALUES
-- Riad Dar El Bacha (Marrakech)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Suite Jasmine', 'SUITE', 'Suite de luxe avec lit King size, salon marocain et cheminée.', 1200.00, 2, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Chambre Atlas', 'DOUBLE', 'Chambre avec vue sur le patio et lit double confortable.', 800.00, 2, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Chambre Menara', 'SINGLE', 'Petite chambre confortable idéale pour voyageur solo.', 500.00, 1, TRUE),

-- Riad Fès Authentique (Fès)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Suite Royale Fassi', 'SUITE', 'Immense suite sous plafonds en bois de cèdre sculpté.', 1500.00, 4, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Chambre Andalouse', 'DOUBLE', 'Chambre avec lit double confortable et ornements traditionnels.', 700.00, 2, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Chambre Mosaïque', 'SINGLE', 'Petite chambre confortable décorée de zelliges colorés.', 450.00, 1, TRUE),

-- Riad Mogador Wave (Essaouira)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'Chambre Ocean', 'DOUBLE', 'Chambre lumineuse avec fenêtre donnant directement sur la mer.', 900.00, 2, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'Suite Marine', 'SUITE', 'Grande suite avec terrasse privée et vue sur la baie d Essaouira.', 1400.00, 3, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'Chambre Vent du Sud', 'DOUBLE', 'Chambre chaleureuse au design d artisanat local.', 800.00, 2, TRUE),

-- Riad Cinnamon (Marrakech)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'Suite Epices', 'SUITE', 'Superbe suite avec salon traditionnel marocain.', 1300.00, 3, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'Chambre Safran', 'DOUBLE', 'Décoration chaleureuse aux tons safranés.', 850.00, 2, TRUE),

-- Riad Souafine (Fès)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b20', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', 'Suite Patio', 'SUITE', 'Grande suite ouverte sur le patio central arboré.', 1450.00, 3, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', 'Chambre Zellige', 'DOUBLE', 'Murs ornés de zelliges bleus et blancs typiques de Fès.', 950.00, 2, TRUE),

-- Riad Baoussala (Essaouira)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b30', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Chambre Jardin', 'DOUBLE', 'Chambre paisible donnant sur le grand jardin fleuri.', 850.00, 2, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b31', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Suite Atlas Vista', 'SUITE', 'Belle suite à l étage avec vue dégagée sur la campagne.', 1250.00, 3, TRUE);

-- 4. Insertion des Photos
INSERT INTO photos (id, url, riad_id, chambre_id) VALUES
-- Riad Dar El Bacha
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783959393/j5jlng36f4zyt1vswgou.jpg', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783967958/zqteceqgnoet97bohtka.jpg', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f04', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783959443/ovth8kcv4z1xzoqj1z9o.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970648/zw1fdouochvkma354lg3.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02'),

-- Riad Fès Authentique
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970585/bw4yy91zrdiyafpatgdf.jpg', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970640/gwarp7eop8mlw8snwvlt.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04'),

-- Riad Mogador Wave
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783959416/okulb7fkvy7e8zicav96.jpg', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f51', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970648/zw1fdouochvkma354lg3.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05'),

-- Riad Cinnamon
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f60', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970595/yqgirb5y3lgfx4fhkkab.jpg', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f61', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970640/gwarp7eop8mlw8snwvlt.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10'),

-- Riad Souafine
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f70', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970605/wcnibjlbhpfyiiqqoo5q.jpg', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f71', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970648/zw1fdouochvkma354lg3.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b20'),

-- Riad Baoussala
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f80', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970617/aqskvqxtotsxib4btkig.jpg', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f81', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970640/gwarp7eop8mlw8snwvlt.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b30'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f08', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970640/gwarp7eop8mlw8snwvlt.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f09', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970648/zw1fdouochvkma354lg3.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f10', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783959443/ovth8kcv4z1xzoqj1z9o.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970640/gwarp7eop8mlw8snwvlt.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783959443/ovth8kcv4z1xzoqj1z9o.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f14', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970648/zw1fdouochvkma354lg3.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f15', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970640/gwarp7eop8mlw8snwvlt.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f16', 'https://res.cloudinary.com/mgmnml6e/image/upload/v1783970648/zw1fdouochvkma354lg3.jpg', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b31');

-- 5. Insertion des Réservations
INSERT INTO reservations (id, client_id, riad_id, date_debut, date_fin, prix_total, statut, riad_entier) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', '2026-08-01', '2026-08-05', 8000.00, 'CONFIRMEE', FALSE);
INSERT INTO reservation_chambres (reservation_id, chambre_id) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'),
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02');

-- 6. Insertion des Paiements
INSERT INTO paiements (id, reservation_id, montant, methode_paiement, statut_paiement) VALUES
('20eebc99-9c0b-4ef8-bb6d-6bb9bd380001', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 8000.00, 'CARTE_BANCAIRE', 'REUSSI');

-- 7. Insertion des Avis
INSERT INTO avis (id, client_id, riad_id, note, commentaire) VALUES
('30eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 5, 'Séjour extraordinaire ! La suite Jasmine est somptueuse et le service est irréprochable.');
