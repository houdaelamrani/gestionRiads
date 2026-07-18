"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  fr: {
    // Header/Navbar
    nav_riads: "Nos Riads",
    nav_services: "Nos Services",
    nav_catalogue: "🏡 Catalogue",
    nav_reservations: " Mes Réservations",
    hello: "Bonjour,",
    espace_client: " Mon Espace Client",
    logout: "Déconnexion",
    login: "Connexion",
    register: "S'inscrire",
    
    // Hero
    hero_subtitle: "Une immersion marocaine authentique",
    hero_title: "Trouvez le Riad de vos Rêves au Maroc",
    hero_desc: "Réservez une chambre unique, plusieurs suites pour votre famille, ou privatisez un riad entier à Marrakech, Fès ou Essaouira.",

    // Search
    search_destination: "Destination (Ville)",
    search_anywhere: "N'importe où (Toutes les villes)",
    search_title: "Rechercher",

    // Main / Riads Section
    riads_title: "Riads Authentiques Populaires",
    riads_desc: "Découvrez notre sélection de Riads validés par notre équipe, prêts à vous accueillir.",
    loading_riads: "Chargement des riads...",
    no_riads: "Aucun riad disponible dans cette ville pour le moment.",
    chambres_count: "chambres",
    per_night: "par nuit",
    mad_per_night: "MAD par nuit",

    // Services Section
    services_title: "Nos Services Premium & Rituels",
    services_desc: "Profitez d'une gamme de services exclusifs disponibles dans nos riads pour sublimer votre séjour :",
    service_spa_title: "Espace Spa & Bien-être",
    service_spa_desc: "Offrez-vous un moment de détente absolue avec des massages aux huiles essentielles d'argan bio et des soins du visage apaisants.",
    service_hammam_title: "Hammam Traditionnel",
    service_hammam_desc: "Découvrez le rituel ancestral du gommage au savon noir marocain et gant de kessa traditionnel pour purifier votre corps.",
    service_traiteur_title: "Service Traiteur & Gastronomie",
    service_traiteur_desc: "Dégustez des plats typiques marocains (tajines, couscous, pastillas) cuisinés avec amour par nos chefs à partir d'ingrédients frais et locaux.",

    // Footer
    footer_desc: "La plateforme de référence pour réserver des séjours uniques dans les plus beaux riads traditionnels du Maroc.",
    footer_destinations: "Destinations",
    footer_platform: "Plateforme",
    footer_newsletter: "Newsletter",
    newsletter_desc: "Abonnez-vous pour recevoir des offres exclusives.",
    newsletter_placeholder: "Votre email",
    newsletter_btn: "S'abonner",
    newsletter_success: "Abonnement réussi !",
    footer_rights: "© 2026 MoroccoRiads. Tous droits réservés.",
    footer_motto: "L'art de l'hospitalité marocaine au cœur de la médina.",

    // Auth (Login)
    login_title: "Ravi de vous revoir !",
    login_subtitle: "Connectez-vous pour accéder à votre espace personnalisé.",
    login_email: "Adresse email",
    login_password: "Mot de passe",
    login_btn: "Se connecter",
    login_loading: "Connexion en cours...",
    login_new: "Nouveau sur MoroccoRiads ?",
    login_create: "Créer un compte",
    login_err_required: "Veuillez remplir tous les champs obligatoires.",
    login_success: "Connexion réussie ! Redirection vers votre espace...",

    // Auth (Register)
    register_title: "Créer votre compte",
    register_subtitle: "Rejoignez-nous pour réserver ou proposer vos Riads au Maroc.",
    register_nom: "Nom",
    register_prenom: "Prénom",
    register_email: "Adresse email",
    register_phone: "Téléphone (Optionnel)",
    register_password: "Mot de passe",
    register_loading: "Création du compte...",
    register_btn: "Créer mon compte",
    register_already: "Vous avez déjà un compte ?",
    register_login: "Se connecter",
    register_err_required: "Veuillez remplir tous les champs obligatoires.",
    register_err_password_length: "Le mot de passe doit contenir au moins 6 caractères.",
    register_success: "Inscription réussie ! Connexion automatique...",

    // Client space layout / loading
    loading_space: "Chargement de votre espace...",
    
    // Client Catalogue
    catalogue_title: "Découvrez nos Riads",
    catalogue_subtitle: "Sélectionnez un riad pour visualiser ses chambres et réserver.",
    no_riads_zone: "Aucun riad disponible dans cette zone pour le moment.",
    photos_count: "photos",
    view_rooms: "Voir les Chambres",
    starting_from: "À partir de",
    rooms_count: "chambre(s)",

    // Client Reservations
    reservations_title: "Mes Réservations",
    reservations_subtitle: "Retrouvez ici toutes vos réservations passées et en cours.",
    no_reservations: "Vous n'avez pas encore de réservations.",
    explore_riads: "Explorer les Riads",
    from: "Du",
    to: "au",
    total: "Total :",
    entire_riad: "🏡 Riad entier",
    cancel: "Annuler",
    leave_review: "⭐ Laisser un avis",
    review_title: "⭐ Avis —",
    your_rating: "Votre note",
    your_comment: "Votre commentaire (optionnel)",
    comment_placeholder: "Racontez votre expérience dans ce riad...",
    submit_review: "Soumettre mon avis",
    sending_review: "Envoi en cours...",
    res_cancelled: "Réservation annulée.",
    review_success: "Avis soumis avec succès ! Merci pour votre retour.",
    status_pending: "En attente",
    status_confirmed: "Confirmée",
    status_cancelled: "Annulée",
    status_refused: "Refusée",
    confirm_cancel: "Êtes-vous sûr de vouloir annuler cette réservation ?",

    // Riad Detail
    back_to_catalogue: "Retour au catalogue",
    riad_not_found: "Riad non trouvé.",
    service_spa: " Spa & Bien-être",
    service_hammam: " Hammam Traditionnel",
    service_catering: " Service Traiteur",
    reviews_label: "avis",
    entire_riad_reserved: " Riad entier réservé",
    privatization_unavailable: " Privatisation indisponible (chambres occupées)",
    privatize_entire_riad: " Privatiser le Riad entier",
    available_rooms: "Chambres & Suites Disponibles",
    no_rooms_available: "Aucune chambre disponible pour ce Riad.",
    max_capacity: " Capacité maximale :",
    travelers: "Voyageurs",
    book_this_room: "Réservez cette chambre",
    pending_validation: "En attente de validation",
    traveler_reviews: " Avis Voyageurs",
    no_reviews_yet: "Aucun avis pour l'instant. Soyez le premier à partager votre séjour !",
    check_in_date: "Date d'arrivée",
    check_out_date: "Date de départ",
    payment_method: "Mode de paiement",
    credit_card: " Carte Bancaire",
    paypal_secure: " PayPal (Sécurisé)",
    on_site_cash: " Sur Place (Espèces)",
    nights_label: "Nuits",
    unit_price: "Tarif unitaire",
    confirm_and_book: "Confirmer et Réserver",
    creating_booking: "Création...",
    err_fill_dates: "Veuillez renseigner vos dates de séjour.",
    err_date_order: "La date de départ doit être après la date d'arrivée.",
    success_booking_pending: "Réservation créée. En attente de validation.",
    success_booking_confirmed: "Félicitations ! Votre réservation a été créée et confirmée.",
    merchant: "Marchand",
    amount: "Montant",
    paypal_email: "Adresse email PayPal",
    pay: "Payer",
    cancel_and_return: "Annuler et retourner sur le site",
    processing_payment: "Traitement du paiement en cours...",
    dont_close_window: "Veuillez ne pas fermer cette fenêtre. Connexion sécurisée au réseau bancaire.",
    payment_authorized: "Paiement Autorisé avec Succès !",
    auto_redirect: "Redirection automatique vers l'application...",
    paypal_tx_id: "Transaction PayPal ID:",
    secure_connection: "Connexion sécurisée"
  },
  en: {
    // Header/Navbar
    nav_riads: "Our Riads",
    nav_services: "Our Services",
    nav_catalogue: "🏡 Catalog",
    nav_reservations: "📋 My Reservations",
    hello: "Hello,",
    espace_client: "📋 My Client Space",
    logout: "Log Out",
    login: "Log In",
    register: "Sign Up",
    
    // Hero
    hero_subtitle: "An authentic Moroccan immersion",
    hero_title: "Find Your Dream Riad in Morocco",
    hero_desc: "Book a unique room, multiple suites for your family, or privatize an entire riad in Marrakech, Fez or Essaouira.",

    // Search
    search_destination: "Destination (City)",
    search_anywhere: "Anywhere (All cities)",
    search_title: "Search",

    // Main / Riads Section
    riads_title: "Popular Authentic Riads",
    riads_desc: "Discover our selection of Riads verified by our team, ready to welcome you.",
    loading_riads: "Loading riads...",
    no_riads: "No riads available in this city at the moment.",
    chambres_count: "rooms",
    per_night: "per night",
    mad_per_night: "MAD per night",

    // Services Section
    services_title: "Our Premium Services & Rituals",
    services_desc: "Enjoy a range of exclusive services available in our riads to enhance your stay:",
    service_spa_title: "Spa & Wellness Area",
    service_spa_desc: "Treat yourself to a moment of absolute relaxation with massages with organic argan essential oils and soothing facials.",
    service_hammam_title: "Traditional Hammam",
    service_hammam_desc: "Discover the ancestral ritual of scrubbing with Moroccan black soap and a traditional kessa glove to purify your body.",
    service_traiteur_title: "Catering & Gastronomy Service",
    service_traiteur_desc: "Taste typical Moroccan dishes (tajines, couscous, pastillas) cooked with love by our chefs from fresh, local ingredients.",

    // Footer
    footer_desc: "The leading platform for booking unique stays in the most beautiful traditional riads in Morocco.",
    footer_destinations: "Destinations",
    footer_platform: "Platform",
    footer_newsletter: "Newsletter",
    newsletter_desc: "Subscribe to receive exclusive offers.",
    newsletter_placeholder: "Your email",
    newsletter_btn: "Subscribe",
    newsletter_success: "Subscription successful!",
    footer_rights: "© 2026 MoroccoRiads. All rights reserved.",
    footer_motto: "The art of Moroccan hospitality in the heart of the medina.",

    // Auth (Login)
    login_title: "Welcome back!",
    login_subtitle: "Log in to access your personalized space.",
    login_email: "Email address",
    login_password: "Password",
    login_btn: "Log In",
    login_loading: "Logging in...",
    login_new: "New to MoroccoRiads?",
    login_create: "Create an account",
    login_err_required: "Please fill in all required fields.",
    login_success: "Login successful! Redirecting to your space...",

    // Auth (Register)
    register_title: "Create your account",
    register_subtitle: "Join us to book or offer your Riads in Morocco.",
    register_nom: "Last name",
    register_prenom: "First name",
    register_email: "Email address",
    register_phone: "Phone (Optional)",
    register_password: "Password",
    register_loading: "Creating account...",
    register_btn: "Create my account",
    register_already: "Already have an account?",
    register_login: "Log in",
    register_err_required: "Please fill in all required fields.",
    register_err_password_length: "Password must be at least 6 characters long.",
    register_success: "Registration successful! Logging in...",

    // Client space layout / loading
    loading_space: "Loading your space...",
    
    // Client Catalog
    catalogue_title: "Discover our Riads",
    catalogue_subtitle: "Select a riad to view its rooms and book.",
    no_riads_zone: "No riads available in this zone at the moment.",
    photos_count: "photos",
    view_rooms: "View Rooms",
    starting_from: "Starting from",
    rooms_count: "room(s)",

    // Client Reservations
    reservations_title: "My Reservations",
    reservations_subtitle: "Find all your past and current reservations here.",
    no_reservations: "You do not have any reservations yet.",
    explore_riads: "Explore Riads",
    from: "From",
    to: "to",
    total: "Total:",
    entire_riad: "🏡 Entire Riad",
    cancel: "Cancel",
    leave_review: "⭐ Leave a review",
    review_title: "⭐ Review —",
    your_rating: "Your rating",
    your_comment: "Your comment (optional)",
    comment_placeholder: "Tell us about your experience in this riad...",
    submit_review: "Submit my review",
    sending_review: "Submitting...",
    res_cancelled: "Reservation cancelled.",
    review_success: "Review submitted successfully! Thank you for your feedback.",
    status_pending: "Pending",
    status_confirmed: "Confirmed",
    status_cancelled: "Cancelled",
    status_refused: "Refused",
    confirm_cancel: "Are you sure you want to cancel this reservation?",

    // Riad Detail
    back_to_catalogue: "Back to catalog",
    riad_not_found: "Riad not found.",
    service_spa: " Spa & Wellness",
    service_hammam: " Traditional Hammam",
    service_catering: " Catering Service",
    reviews_label: "reviews",
    entire_riad_reserved: " Entire Riad reserved",
    privatization_unavailable: " Privatization unavailable (occupied rooms)",
    privatize_entire_riad: " Privatize the entire Riad",
    available_rooms: "Available Rooms & Suites",
    no_rooms_available: "No rooms available for this Riad.",
    max_capacity: " Max capacity:",
    travelers: "Travelers",
    book_this_room: "Book this room",
    pending_validation: "Pending validation",
    traveler_reviews: " Traveler Reviews",
    no_reviews_yet: "No reviews yet. Be the first to share your stay!",
    check_in_date: "Check-in date",
    check_out_date: "Check-out date",
    payment_method: "Payment method",
    credit_card: " Credit Card",
    paypal_secure: " PayPal (Secure)",
    on_site_cash: " On Site (Cash)",
    nights_label: "Nights",
    unit_price: "Unit price",
    confirm_and_book: "Confirm and Book",
    creating_booking: "Booking...",
    err_fill_dates: "Please enter your stay dates.",
    err_date_order: "Check-out date must be after check-in date.",
    success_booking_pending: "Reservation created. Pending validation.",
    success_booking_confirmed: "Congratulations! Your reservation has been created and confirmed.",
    merchant: "Merchant",
    amount: "Amount",
    paypal_email: "PayPal email address",
    pay: "Pay",
    cancel_and_return: "Cancel and return to site",
    processing_payment: "Processing payment...",
    dont_close_window: "Please do not close this window. Secure connection to banking network.",
    payment_authorized: "Payment Authorized Successfully!",
    auto_redirect: "Automatic redirection to application...",
    paypal_tx_id: "PayPal Transaction ID:",
    secure_connection: "Secure connection"
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("fr");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang === "en" || savedLang === "fr") {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang) => {
    if (lang === "en" || lang === "fr") {
      setLanguageState(lang);
      localStorage.setItem("lang", lang);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations["fr"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
