-- Script d'insertion de données de test (data.sql)
-- Ce script pré-remplit la base de données avec des enregistrements de démonstration pour valider l'intégrité relationnelle.

-- Nettoyage préalable des tables (optionnel si utilisé après schema.sql)
TRUNCATE TABLE avis, paiements, reservation_chambres, reservations, photos, chambres, riads, utilisateurs CASCADE;

-- 1. Insertion des Utilisateurs (Administrateur, Propriétaires, Clients)
-- Les mots de passe sont en texte clair pour le test, mais seront hashés par Spring Boot en production.
INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, telephone, role, statut) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'El Amrani', 'Yassine', 'admin@riad.ma', 'admin123', '+212600000001', 'ADMIN', 'ACTIF'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Alaoui', 'Mustapha', 'owner1@riad.ma', 'owner123', '+212600000002', 'PROPRIETAIRE', 'ACTIF'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Tazi', 'Khadija', 'owner2@riad.ma', 'owner123', '+212600000003', 'PROPRIETAIRE', 'ACTIF'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Dupont', 'Jean', 'client1@riad.ma', 'client123', '+33612345678', 'CLIENT', 'ACTIF'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Bennani', 'Salma', 'client2@riad.ma', 'client123', '+212611223344', 'CLIENT', 'ACTIF');

-- 2. Insertion des Riads
INSERT INTO riads (id, nom, description, adresse, ville, proprietaire_id, statut_validation, prix_riad_entier) VALUES
-- Riad A (Marrakech) : Propriété de owner1, Validé, avec prix spécial riad entier
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Riad Dar El Bacha', 'Un havre de paix au coeur de la médina de Marrakech avec piscine et toit terrasse.', '12 Rue Dar El Bacha, Médina', 'Marrakech', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'VALIDE', 2500.00),
-- Riad B (Fès) : Propriété de owner1, En attente de validation par l'admin
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Riad Fès Authentique', 'Riad traditionnel restauré avec zelliges historiques et patio ombragé.', '45 Derb el Miter, Fès El Bali', 'Fès', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'EN_ATTENTE', 1800.00),
-- Riad C (Essaouira) : Propriété de owner2, Validé
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'Riad Mogador Wave', 'Riad vue sur mer, design moderne mélangé à l artisanat d Essaouira.', '8 Avenue de la Plage, Essaouira', 'Essaouira', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'VALIDE', 1200.00);

-- 3. Insertion des Chambres
INSERT INTO chambres (id, riad_id, nom_chambre, type_chambre, description, prix_par_nuit, capacite, disponible) VALUES
-- Chambres pour Riad Dar El Bacha (Marrakech)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Suite Jasmine', 'SUITE', 'Suite de luxe avec lit King size, salon marocain et cheminée.', 1200.00, 2, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Chambre Atlas', 'DOUBLE', 'Chambre avec vue sur le patio et lit double confortable.', 800.00, 2, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Chambre Menara', 'SINGLE', 'Petite chambre confortable idéale pour voyageur solo.', 500.00, 1, TRUE),

-- Chambres pour Riad Fès Authentique (Fès)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Suite Royale Fassi', 'SUITE', 'Immense suite sous plafonds en bois de cèdre sculpté.', 1500.00, 4, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Chambre Andalouse', 'DOUBLE', 'Chambre avec lit double confortable et ornements traditionnels.', 700.00, 2, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Chambre Mosaïque', 'SINGLE', 'Petite chambre confortable décorée de zelliges colorés.', 450.00, 1, TRUE),

-- Chambres pour Riad Mogador Wave (Essaouira)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'Chambre Ocean', 'DOUBLE', 'Chambre lumineuse avec fenêtre donnant directement sur la mer.', 900.00, 2, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'Suite Marine', 'SUITE', 'Grande suite avec terrasse privée et vue sur la baie d Essaouira.', 1400.00, 3, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'Chambre Vent du Sud', 'DOUBLE', 'Chambre chaleureuse au design d artisanat local.', 800.00, 2, TRUE);

-- 4. Insertion des Photos (Images Réelles Unsplash de Riads Marocains)
INSERT INTO photos (id, url, riad_id, chambre_id) VALUES
-- Riad Dar El Bacha (Marrakech) - 4 Photos
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=800', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL),

-- Riad Fès Authentique (Fès) - 3 Photos
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', NULL),

-- Riad Mogador Wave (Essaouira) - 3 Photos
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=800', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', NULL),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', NULL),

-- Photos des Chambres
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f04', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f06', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=800', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f08', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=800', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f09', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=800', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f51', 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=800', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f52', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f53', 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800', NULL, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09');

-- 5. Insertion des Réservations
-- Cas 1 : Client 1 réserve DEUX chambres en même temps (Suite Jasmine + Chambre Atlas) à Dar El Bacha
INSERT INTO reservations (id, client_id, riad_id, date_debut, date_fin, prix_total, statut, riad_entier) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', '2026-08-01', '2026-08-05', 8000.00, 'CONFIRMEE', FALSE);
-- Liaison des chambres réservées dans la table d'association
INSERT INTO reservation_chambres (reservation_id, chambre_id) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'), -- Suite Jasmine (1200 MAD/nuit)
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02');  -- Chambre Atlas (800 MAD/nuit)
-- Note : Prix total = (1200 + 800) * 4 nuits = 8000 MAD.

-- Cas 2 : Client 2 réserve UNE seule chambre (Chambre Ocean) à Essaouira
INSERT INTO reservations (id, client_id, riad_id, date_debut, date_fin, prix_total, statut, riad_entier) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', '2026-08-10', '2026-08-12', 1800.00, 'EN_ATTENTE', FALSE);
-- Liaison de la chambre réservée
INSERT INTO reservation_chambres (reservation_id, chambre_id) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05'); -- Chambre Ocean (900 MAD/nuit)
-- Note : Prix total = 900 * 2 nuits = 1800 MAD.

-- Cas 3 : Client 1 réserve le RIAD ENTIER (Dar El Bacha) pour un weekend
INSERT INTO reservations (id, client_id, riad_id, date_debut, date_fin, prix_total, statut, riad_entier) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', '2026-09-01', '2026-09-03', 5000.00, 'CONFIRMEE', TRUE);
-- Liaison de TOUTES les chambres de ce Riad
INSERT INTO reservation_chambres (reservation_id, chambre_id) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'),
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02'),
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03');
-- Note : Tarif spécial Riad entier = 2500 MAD/nuit * 2 nuits = 5000 MAD.

-- 6. Insertion des Paiements (UUIDs valides corrigés)
INSERT INTO paiements (id, reservation_id, montant, methode_paiement, statut_paiement) VALUES
-- Paiement complet pour la première réservation (Carte Bancaire)
('20eebc99-9c0b-4ef8-bb6d-6bb9bd380001', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 8000.00, 'CARTE_BANCAIRE', 'REUSSI'),
-- Paiement sur place pour le Riad entier
('20eebc99-9c0b-4ef8-bb6d-6bb9bd380002', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 5000.00, 'SUR_PLACE', 'EN_ATTENTE');

-- 7. Insertion des Avis (UUID valide corrigé)
INSERT INTO avis (id, client_id, riad_id, note, commentaire) VALUES
('30eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 5, 'Séjour extraordinaire ! La suite Jasmine est somptueuse et le service est irréprochable.');
