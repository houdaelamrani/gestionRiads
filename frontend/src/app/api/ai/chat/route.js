import { NextResponse } from "next/server";

// ============================================================================
// MOROCCORIADS - SYSTÈME EXPERT D'INTELLIGENCE ARTIFICIELLE SYMBOLIQUE & BASE DE CONNAISSANCES COMPLÈTE
// 100% Algorithmique, Déterministe, Zéro Machine Learning
// ============================================================================

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8080";

function mapPhoto(url) {
  if (!url) return null;
  if (url.includes("photo-1539650116574")) {
    return "https://res.cloudinary.com/mgmnml6e/image/upload/v1783959393/j5jlng36f4zyt1vswgou.jpg";
  }
  if (url.includes("photo-1506929562872")) {
    return "https://res.cloudinary.com/mgmnml6e/image/upload/v1783959416/okulb7fkvy7e8zicav96.jpg";
  }
  if (url.includes("photo-1618773928121")) {
    return "https://res.cloudinary.com/mgmnml6e/image/upload/v1783959443/ovth8kcv4z1xzoqj1z9o.jpg";
  }
  return url;
}

// Récupération des riads et de leurs chambres en temps réel depuis PostgreSQL
async function getLiveRiads() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/riads/recherche`, { cache: "no-store" });
    if (!res.ok) return [];
    const riads = await res.json();

    const enriched = await Promise.all(
      riads.map(async (r) => {
        let photoUrl = null;
        let chambres = [];
        try {
          // Photos
          const pRes = await fetch(`${BACKEND_URL}/api/riads/${r.id}/photos`, { cache: "no-store" });
          if (pRes.ok) {
            const pData = await pRes.json();
            if (pData && pData.length > 0) {
              photoUrl = mapPhoto(pData[0].url);
            }
          }

          // Chambres disponibles
          const cRes = await fetch(`${BACKEND_URL}/api/riads/${r.id}/chambres`, { cache: "no-store" });
          if (cRes.ok) {
            const cData = await cRes.json();
            if (Array.isArray(cData)) {
              chambres = cData;
            }
          }
        } catch (e) {
          // ignore
        }

        return {
          id: r.id,
          nom: r.nom,
          ville: r.ville,
          adresse: r.adresse,
          description: r.description,
          prixRiadEntier: r.prixRiadEntier,
          hasSpa: r.hasSpa,
          hasHammam: r.hasHammam,
          hasTraiteur: r.hasTraiteur,
          chambres: chambres,
          chambresCount: chambres.length || 0,
          photoUrl: photoUrl || "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80",
        };
      })
    );
    return enriched;
  } catch (error) {
    console.error("Erreur chargement riads depuis Spring Boot:", error);
    return [];
  }
}

// -------------------------------------------------------------
// 1. MODULE NLP : NORMALISATION ET ANALYSE SÉMANTIQUE
// -------------------------------------------------------------
function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // suppression accents
    .replace(/[^a-z0-9\s]/g, " ") // suppression ponctuation
    .replace(/\s+/g, " ")
    .trim();
}

function analyzeQuery(normalized) {
  const words = normalized.split(" ").filter((w) => w.length > 1);

  const hasAny = (...terms) => terms.some((t) => normalized.includes(t));
  const hasWord = (...wList) => wList.some((w) => words.includes(w));

  // Villes
  const isMarrakech = hasAny("marrakech", "kech", "marrakesh", "medina marrakech");
  const isFes = hasAny("fes", "fez", "fassi");
  const isEssaouira = hasAny("essaouira", "mogador", "souira");
  const isChefchaouen = hasAny("chefchaouen", "chaouen", "ville bleue");
  const isRabat = hasAny("rabat");
  const isCasablanca = hasAny("casablanca", "casa");
  const isTanger = hasAny("tanger", "tangier");
  const isAgadir = hasAny("agadir", "taghazout");
  const isDesert = hasAny("desert", "sahara", "merzouga", "zagora", "dune", "dunes", "chameau", "dromadaire", "bivouac", "agafay");

  // Durée
  let duration = null;
  const numMatch = normalized.match(/(\d+)\s*(jour|jours|nuit|nuits|j|semaine|semaines)/);
  if (numMatch) {
    let n = parseInt(numMatch[1], 10);
    if (numMatch[2].startsWith("semaine")) n = n * 7;
    duration = n;
  } else if (hasAny("week end", "weekend")) {
    duration = 2;
  } else if (hasAny("une semaine", "1 semaine")) {
    duration = 7;
  }

  return {
    normalized,
    words,
    hasAny,
    hasWord,
    isMarrakech,
    isFes,
    isEssaouira,
    isChefchaouen,
    isRabat,
    isCasablanca,
    isTanger,
    isAgadir,
    isDesert,
    duration,
  };
}

// Fonction pour formater textuellement les chambres d'un riad
function formatRiadChambresText(riad) {
  if (!riad.chambres || riad.chambres.length === 0) {
    return `• *Riad entier : ${riad.prixRiadEntier ? Number(riad.prixRiadEntier).toLocaleString("fr-FR") + " MAD / nuit" : "Prix sur demande"}*`;
  }
  const lines = riad.chambres.map((c) => 
    `  - **${c.nomChambre}** (${c.typeChambre || "Chambre"}) : **${Number(c.prixParNuit).toLocaleString("fr-FR")} MAD** / nuit (capacité: ${c.capacite || 2} pers)`
  );
  if (riad.prixRiadEntier) {
    lines.push(`  - 🏰 *Option Riad entier privatisé : ${Number(riad.prixRiadEntier).toLocaleString("fr-FR")} MAD / nuit*`);
  }
  return lines.join("\n");
}

// -------------------------------------------------------------
// 2. BASE DE CONNAISSANCES EXPERTE : RÈGLES ORDONNÉES PAR PRÉCISION
// -------------------------------------------------------------
function evaluateKnowledgeBase(message, q, riads) {
  const { hasAny, hasWord, isMarrakech, isFes, isEssaouira, isChefchaouen, isRabat, isCasablanca, isTanger, isAgadir, isDesert, duration, normalized } = q;

  const kechRiads = riads.filter((r) => normalize(r.ville).includes("marrakech"));
  const fesRiads = riads.filter((r) => normalize(r.ville).includes("fes"));
  const essaouiraRiads = riads.filter((r) => normalize(r.ville).includes("essaouira"));

  // 1. SALUTATIONS & ACCUEIL
  if (hasAny("bonjour", "salut", "salam", "sba7", "sbah", "sbah el khir", "hello", "coucou", "bonsoir", "hey", "marhaban", "ahlan")) {
    return {
      reply: `Bonjour ! Je suis **Houda**, votre Concierge & Conceptrice de Voyage IA. Je suis ici pour vous organiser votre séjour sur mesure avec le devis en 1 clic ! 🏰✨

🏙️ **Villes disponibles pour la réservation :**
Choisissez une destination ci-dessous pour découvrir nos riads et leurs chambres disponibles :
• 🌴 **Marrakech** : La Ville Rouge, ses palais et son ambiance vibrante.
• 🕌 **Fès** : La capitale spirituelle, ses ruelles médiévales et ses tanneries.
• 🌊 **Essaouira** : La cité des vents, ses remparts face à l'Atlantique et sa sérénité.

Quelle ville souhaitez-vous explorer ?`,
      suggestions: [
        "📍 Marrakech",
        "📍 Fès",
        "📍 Essaouira",
        "🌴 Circuit combiné Marrakech + Essaouira (4 jours)",
        "💆 Riads avec Spa & Hammam",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 2. CHOIX OU DEMANDE DE VILLE DIRECTE (Marrakech, Fès, Essaouira) -> AFFICHE LES RIADS ET CHAMBRES
  if (isMarrakech && !isEssaouira && !isFes && !q.duration) {
    const details = kechRiads.map((r) => `🏰 **${r.nom}** (📍 ${r.adresse || "Médina de Marrakech"})\n${formatRiadChambresText(r)}`).join("\n\n");
    return {
      reply: `Marhaban ! 🌴 Voici les **Riads et chambres disponibles à Marrakech** pour votre séjour :

${details}

Vous pouvez cliquer sur **Voir & Réserver** sur n'importe quel riad ci-dessous pour finaliser votre réservation en ligne ou sur place !`,
      riads: kechRiads,
      suggestions: [
        "🌴 Circuit combiné Marrakech + Essaouira (4 jours)",
        "💆 Riads avec Spa & Hammam à Marrakech",
        "🍽️ Qu'est-ce qu'on mange au petit-déjeuner ?",
        "📍 Voir les riads à Fès",
        "📍 Voir les riads à Essaouira",
      ],
    };
  }

  if (isFes && !isMarrakech && !isEssaouira && !q.duration) {
    const details = fesRiads.map((r) => `🏛️ **${r.nom}** (📍 ${r.adresse || "Médina de Fès"})\n${formatRiadChambresText(r)}`).join("\n\n");
    return {
      reply: `Marhaban ! 🕌 Voici les **Riads et chambres disponibles à Fès** au cœur de la médina historique :

${details}

Cliquez sur **Voir & Réserver** pour sélectionner vos dates et confirmer votre chambre en quelques secondes !`,
      riads: fesRiads,
      suggestions: [
        "Que visiter en 2 ou 3 jours à Fès ?",
        "Riads avec Table d'hôtes à Fès",
        "📍 Voir les riads à Marrakech",
        "📍 Voir les riads à Essaouira",
      ],
    };
  }

  if (isEssaouira && !isMarrakech && !isFes && !q.duration) {
    const details = essaouiraRiads.map((r) => `🌊 **${r.nom}** (📍 ${r.adresse || "Essaouira Médina"})\n${formatRiadChambresText(r)}`).join("\n\n");
    return {
      reply: `Marhaban ! 🌊 Voici les **Riads et chambres disponibles à Essaouira** face à l'océan Atlantique :

${details}

Cliquez sur le riad de votre choix pour découvrir les photos et réserver votre séjour au grand air marin !`,
      riads: essaouiraRiads,
      suggestions: [
        "Combiner Essaouira et Marrakech (Circuit 4 jours)",
        "Riads avec rooftop vue mer à Essaouira",
        "📍 Voir les riads à Marrakech",
        "📍 Voir les riads à Fès",
      ],
    };
  }

  // 3. POLITESSE & REMERCIEMENTS
  if (hasAny("merci", "chokran", "choukrane", "barak allah", "parfait", "super", "top", "genial", "excellent", "bravo", "impeccable")) {
    return {
      reply: `Avec un immense plaisir ! 🌸 **Marhaban bikom**.

Je suis **Houda**, toujours à votre écoute pour organiser votre séjour parfait. N'hésitez pas si vous souhaitez découvrir d'autres villes, des riads avec spa ou des chambres familiales.

Que souhaitez-vous explorer maintenant ?`,
      suggestions: [
        "📍 Marrakech",
        "📍 Fès",
        "📍 Essaouira",
        "🌴 Proposer un circuit multi-villes",
      ],
    };
  }

  // 4. IDENTITÉ & RÔLE DE L'IA
  if (hasAny("qui es tu", "qui est tu", "tu es qui", "ton nom", "t appelles", "tappelles", "qui t a cree", "role", "houda", "bahia")) {
    return {
      reply: `Bonjour ! Je suis **Houda**, votre Concierge & Conceptrice de Voyage IA. Je suis ici pour vous organiser votre séjour sur mesure avec le devis en 1 clic ! 👩‍💼✨

Mon rôle est de vous présenter nos riads et chambres certifiés à **Marrakech**, **Fès** et **Essaouira**, de calculer vos séjours et de répondre à toutes vos questions pratiques.`,
      suggestions: [
        "📍 Voir les riads à Marrakech",
        "📍 Voir les riads à Fès",
        "📍 Voir les riads à Essaouira",
        "🌴 Créer mon circuit sur mesure",
      ],
    };
  }

  // 5. QUESTIONS LUDIQUES / BLAGUES / HUMOUR
  if (hasAny("blague", "raconte une blague", "fais moi rire", "humour", "drole", "histoire drole")) {
    return {
      reply: `Avec plaisir ! Un peu d'humour marocain : 😄🐪

*C'est un voyageur qui arrive à Marrakech et demande à un dromadaire :*
— *"Dis-moi, comment fais-tu pour marcher des heures sous le soleil sans jamais être fatigué ?"*
*Le dromadaire le regarde tranquillement et lui répond :*
— *"C'est simple mon ami... je sais que ce soir, je dors dans un magnifique Riad avec piscine et thé à la menthe !"* ☕🌴

Prêt à réserver votre chambre de rêve ?`,
      suggestions: [
        "📍 Voir les riads à Marrakech",
        "💆 Riads avec piscine et spa",
        "Comment réserver mon séjour ?",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 6. FORMALITÉS, PASSEPORT & VISA
  if (hasAny("visa", "passeport", "carte d identite", "douane", "papier", "formalite", "entrer au maroc", "frontiere")) {
    return {
      reply: `Formalités administratives d'entrée au Royaume du Maroc : 🛂✈️

• 🛂 **Passeport obligatoire** : Un passeport en cours de validité (valable au moins 3 mois après la date de retour) est obligatoire. La carte d'identité seule n'est pas acceptée.
• 🌍 **Exemption de Visa (< 90 jours)** : Les ressortissants de l'Union Européenne, de Suisse, du Canada, des USA, du Royaume-Uni et de nombreux autres pays n'ont **pas besoin de visa** pour un séjour touristique inférieur à 3 mois.`,
      suggestions: [
        "Comment préparer son arrivée à l'aéroport ?",
        "📍 Voir les riads à Marrakech",
        "🌴 Circuit 4 jours Marrakech & Essaouira",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 7. NUMÉROS D'URGENCE, SANTÉ & PHARMACIE
  if (hasAny("urgence", "urgences", "numero d urgence", "numeros d urgence", "samu", "pompier", "pompiers", "police secours", "gendarmerie", "hopital", "malade", "tourista", "docteur", "medecin", "eau du robinet", "eau potable", "vaccin", "pharmacie")) {
    return {
      reply: `Conseils santé, sécurité et numéros d'urgence au Maroc : 💧🩺

• 🚑 **Numéros d'Urgence Officiels** :
  - **SAMU / Ambulances / Pompiers** : ` + "`15`" + `
  - **Police Secours (en ville)** : ` + "`19`" + `
  - **Gendarmerie Royale (hors agglomération)** : ` + "`177`" + `
• 🧴 **Eau de boisson** : Il est recommandé aux voyageurs de boire de l'eau minérale en bouteille capsulée (*Sidi Ali*, *Ain Saiss*, *Ciel*).
• 💊 **Pharmacies** : Présentes dans toutes les médinas avec du personnel francophone qualifié.
• 💉 **Vaccins** : Aucun vaccin spécifique obligatoire pour voyager au Maroc.`,
      suggestions: [
        "Comment réserver un riad avec assistance 24/7 ?",
        "Transports et taxis au Maroc",
        "📍 Voir les riads à Marrakech",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 8. FUMEURS / CIGARETTE / CHICHA
  if (hasAny("fumer", "fumeur", "fumeurs", "cigarette", "cigarettes", "chicha", "vape", "vapoter")) {
    return {
      reply: `Règles concernant les fumeurs dans les Riads : 🚭☀️

• ❌ **Chambres 100% non-fumeurs** : Pour des raisons de sécurité et de préservation des boiseries en cèdre et tentures précieuses, il est strictement interdit de fumer à l'intérieur des chambres.
• ✅ **Espaces extérieurs autorisés** : Vous pouvez fumer librement sur les terrasses rooftop à ciel ouvert et dans certains recoins aérés du patio où des cendriers sont disposés.`,
      suggestions: [
        "Voir les riads avec terrasse rooftop panoramique",
        "📍 Voir les riads à Marrakech",
        "Comment fonctionne la réservation ?",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 9. HORAIRES CHECK-IN / CHECK-OUT / ARRIVÉE TARDIVE
  if (hasAny("check in", "checkin", "check out", "checkout", "heure d arrivee", "heure arrivee", "arrivee tardive", "arriver tard", "partir tot", "heure de depart", "heure depart")) {
    return {
      reply: `Voici les horaires et modalités de séjour dans nos Riads : 🕒🛎️

• 📥 **Check-in (Arrivée)** : À partir de **14h00**. Un thé à la menthe traditionnel et des pâtisseries marocaines vous sont servis à votre arrivée pendant l'enregistrement.
• 📤 **Check-out (Départ)** : Jusqu'à **12h00** (midi).
• 🌙 **Arrivées tardives / Départs matinaux** : Tous nos riads disposent d'un veilleur de nuit ou d'une réception ouverte 24h/24. Prévenez simplement votre hôte de votre heure d'arrivée ou de vol.
• 🧳 **Bagagerie gratuite** : Vous pouvez déposer gratuitement vos bagages au riad avant l'heure du check-in ou après le check-out pour profiter pleinement de la ville !`,
      suggestions: [
        "Comment réserver un transfert aéroport vers le riad ?",
        "Voir nos riads avec conciergerie 24/7",
        "Comment payer ma réservation ?",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 10. CALCUL BUDGÉTAIRE DYNAMIQUE (ex: "combien pour 3 nuits à Marrakech ?")
  if (duration && hasAny("combien", "prix", "cout", "tarif", "total", "payer pour", "devis")) {
    const targetCity = isMarrakech ? "Marrakech" : isFes ? "Fès" : isEssaouira ? "Essaouira" : "Marrakech";
    const cityRiads = riads.filter((r) => normalize(r.ville).includes(normalize(targetCity)));
    const selectedRiad = cityRiads[0] || riads[0];
    const unitPrice = Number(selectedRiad?.prixRiadEntier || 2000);
    const totalPrice = unitPrice * duration;

    return {
      reply: `Voici l'estimation budgétaire calculée pour votre séjour de **${duration} nuits à ${targetCity}** : 💰📊

• 🏨 **Établissement recommandé** : **${selectedRiad?.nom}**
• 💵 **Tarif par nuit (Riad Entier)** : ${unitPrice.toLocaleString("fr-FR")} MAD
• 🧮 **Budget Total estimé (${duration} nuits)** : **${totalPrice.toLocaleString("fr-FR")} MAD** (~${Math.round(totalPrice / 10.8)} €)
• ✨ **Inclus** : Petit-déjeuner traditionnel marocain, service de conciergerie et ménage quotidien.`,
      riads: cityRiads.length > 0 ? cityRiads.slice(0, 3) : riads.slice(0, 3),
      suggestions: [
        "Réserver ce séjour maintenant",
        "Voir les options avec Spa & Hammam",
        "Découvrir d'autres riads à " + targetCity,
      ],
    };
  }

  // 11. GÉNÉRATEUR AUTOMATIQUE DE CIRCUIT MULTI-VILLES
  const isCircuitRequest =
    (isMarrakech && isEssaouira) ||
    (isMarrakech && isFes) ||
    (isEssaouira && isFes) ||
    hasAny("circuit", "combine", "programme", "itineraire", "parcours", "etape", "road trip", "roadtrip") ||
    (duration && duration >= 3 && hasAny("voyage", "sejour", "vacance", "vacances", "visite"));

  if (isCircuitRequest) {
    const days = duration || 4;
    const isFesTarget = isFes || (!isEssaouira && normalized.includes("fes"));

    if (isFesTarget) {
      // Circuit Marrakech + Fès
      const riad1 = kechRiads[0] || riads[0];
      const riad2 = fesRiads[0] || riads[1] || riads[0];
      const nuits1 = Math.ceil(days / 2);
      const nuits2 = Math.floor(days / 2);
      const p1 = Number(riad1?.prixRiadEntier || 2500);
      const p2 = Number(riad2?.prixRiadEntier || 1800);
      const total = p1 * nuits1 + p2 * nuits2;

      return {
        reply: `Marhaban ! 🏛️ Voici votre **Circuit Impérial : Splendeurs de Marrakech & Fès** (${days} Jours / ${days} Nuits) calculé automatiquement :

Une plongée historique et culturelle dans les plus beaux trésors architecturaux et artisanaux du Royaume.`,
        tripPlan: {
          title: "Circuit Impérial : Marrakech & Fès",
          duration: `${days} Jours / ${days} Nuits`,
          totalPrice: `${total.toLocaleString("fr-FR")} MAD`,
          perk: "🎁 Offert : Visite guidée personnalisée de la médina de Fès & thé d'accueil !",
          stages: [
            {
              step: 1,
              city: "Marrakech",
              days: `Jours 1 à ${nuits1} (${nuits1} Nuits)`,
              riad: riad1,
              program: "Palais Bahia, Jardin Majorelle, souks et dîner gastronomique aux chandelles au patio.",
              highlight: "Patio arboré avec piscine & spa",
            },
            {
              step: 2,
              city: "Fès",
              days: `Jours ${nuits1 + 1} à ${days} (${nuits2} Nuits)`,
              riad: riad2,
              program: "Tanneries Chouara, Université Al Quaraouiyine et découverte des artisans dinandiers.",
              highlight: "Demeure historique authentique",
            },
          ],
        },
        suggestions: [
          "Organiser un séjour avec étape à Essaouira",
          "Comment régler et réserver ce circuit ?",
          "Voir les riads avec Spa et Hammam",
        ],
      };
    } else {
      // Circuit Marrakech + Essaouira
      const riad1 = kechRiads[0] || riads[0];
      const riad2 = essaouiraRiads[0] || riads[1] || riads[0];
      const nuits1 = Math.ceil(days / 2);
      const nuits2 = Math.floor(days / 2);
      const p1 = Number(riad1?.prixRiadEntier || 2500);
      const p2 = Number(riad2?.prixRiadEntier || 1200);
      const total = p1 * nuits1 + p2 * nuits2;

      return {
        reply: `Marhaban ! 🌟 J'ai conçu pour vous votre **Séjour Combiné de Rêve : De la Médina Impériale à l'Océan Atlantique** (${days} Jours / ${days} Nuits) :

Un équilibre parfait entre l'énergie captivante de Marrakech et la sérénité ressourçante d'Essaouira.`,
        tripPlan: {
          title: "Circuit Évasion : Marrakech & Essaouira",
          duration: `${days} Jours / ${days} Nuits`,
          totalPrice: `${total.toLocaleString("fr-FR")} MAD`,
          perk: "🎁 Offert : Cérémonie du thé traditionnel & cornes de gazelle à chaque étape !",
          stages: [
            {
              step: 1,
              city: "Marrakech",
              days: `Jours 1 à ${nuits1} (${nuits1} Nuits)`,
              riad: riad1,
              program: "Check-in, détente au patio, visite de la Médersa Ben Youssef et soirée place Jemaa el-Fna.",
              highlight: "Hammam & Spa traditionnel inclus",
            },
            {
              step: 2,
              city: "Essaouira",
              days: `Jours ${nuits1 + 1} à ${days} (${nuits2} Nuits)`,
              riad: riad2,
              program: "Remparts de la Sqala, dégustation de poisson frais au port et coucher de soleil sur l'océan.",
              highlight: "Emplacement vue mer & calme absolu",
            },
          ],
        },
        suggestions: [
          "Existe-t-il une option avec 3 nuits à Marrakech ?",
          "Quels riads proposent un service traiteur ?",
          "Comment fonctionne la réservation ?",
        ],
      };
    }
  }

  // 12. PRIVATISATION DU RIAD (MARIAGE, ANNIVERSAIRE, SÉMINAIRE, GROUPE)
  if (hasAny("privatiser", "privatisation", "riad entier", "tout le riad", "groupe", "mariage", "anniversaire", "evenement", "seminaire", "fete", "famille nombreuse")) {
    return {
      reply: `Privatisez un Riad entier pour un séjour exclusif et inoubliable ! 🏰🎉💍

• 👑 **Exclusivité totale** : Le riad complet (de 4 à 10 chambres privatives) est réservé uniquement pour vous et vos invités (capacité de 8 à 25 personnes).
• 👨‍🍳 **Personnel dédié inclus** : Équipe de majordomes, cuisinière privée pour tous vos repas, service de ménage quotidien et concierge 24h/24.
• 🎊 **Événements sur mesure** : Organisation de mariages féeriques aux chandelles avec musiciens gnaouas, anniversaires surprises, séminaires professionnels ou retraites bien-être.
• 💰 **Tarif Riad Entier** : Indiqué directement sur chaque fiche (de 1 200 à 3 500 MAD par nuit pour l'intégralité du riad).`,
      suggestions: [
        "Voir les tarifs des Riads entiers",
        "Organiser un séjour combiné en groupe",
        "Comment réserver un riad complet ?",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 13. SÉCURITÉ DANS LA MÉDINA & VIE NOCTURNE
  if (hasAny("securite", "dangereux", "peur", "securise", "agression", "voler", "vol", "arnaque", "faux guide", "femme seule", "sortir le soir", "danger")) {
    return {
      reply: `Le Maroc et ses médinas sont réputés pour leur grande sécurité et leur hospitalité légendaire ! 🛡️🌙

• 👮‍♂️ **Présence et surveillance** : Les médinas (Marrakech, Fès, Essaouira) disposent d'une **Brigade Touristique dédiée** et de caméras de surveillance sur les axes principaux.
• 🚶‍♀️ **Voyageurs solo et femmes seules** : Des milliers de voyageuses parcourent le Maroc en toute sérénité chaque année. Les habitants et commerçants sont très serviables en cas d'orientation.
• 🕯️ **Retour au riad en soirée** : Les ruelles sont bien éclairées. Si vous rentrez tard, vous pouvez demander à votre riad de vous envoyer un membre de l'équipe pour vous accompagner depuis la porte de la médina.`,
      suggestions: [
        "Riads situés dans les quartiers les plus réputés",
        "Transfert aéroport sécurisé vers le riad",
        "Conseils pour visiter les souks",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 14. WIFI, INTERNET & TÉLÉTRAVAIL
  if (hasAny("wifi", "wi fi", "internet", "connexion", "fibre", "reseau", "4g", "5g", "sim")) {
    return {
      reply: `Tout est prévu pour rester connecté en toute tranquillité ! 📶📱

• 🌐 **Wi-Fi Haut Débit Gratuit** : Tous nos riads partenaires sont équipés d'une connexion Wi-Fi haut débit (fibre optique) accessible gratuitement dans les chambres, le patio, les salons et sur le rooftop.
• 💼 **Télétravail & Digital Nomads** : Les patios calmes et les terrasses offrent des espaces de travail très agréables et confortables.
• 📲 **Cartes SIM locales** : À l'aéroport ou dans la médina, vous pouvez obtenir une carte SIM marocaine (Maroc Telecom, Orange ou Inwi) avec 10 à 20 Go d'Internet pour environ 50 à 100 MAD (5 à 10 €).`,
      suggestions: [
        "Riads avec rooftop et espace détente",
        "Découvrir les riads à Marrakech",
        "Voir les riads avec piscine",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 15. CLIMATISATION & CHAUFFAGE
  if (hasAny("clim", "climatisation", "climatise", "chauffage", "cheminee", "froid en hiver", "temperature chambre")) {
    return {
      reply: `Le confort thermique est une priorité absolue dans nos hébergements : ❄️🔥

• ❄️ **Climatisation réversible** : Toutes les chambres et suites disposent d'un système de climatisation réversible individuel (air frais en été, chauffage doux en hiver).
• 🪵 **Cheminées traditionnelles** : En période hivernale, les salons du riad et certaines suites disposent de cheminées au feu de bois pour des soirées chaleureuses et authentiques.
• 🏰 **Conception bioclimatique naturelle** : Grâce à leurs murs épais en terre cuite et plâtre traditionnel, les riads conservent naturellement une fraîcheur bienfaisante en plein été.`,
      suggestions: [
        "Voir les riads avec piscine et climatisation",
        "Quel est le climat en hiver au Maroc ?",
        "Découvrir les riads à Fès",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 16. PISCINE, BASSIN & ROOFTOP
  if (hasAny("piscine", "bassin", "baigner", "baignade", "jacuzzi", "plongee", "rooftop", "terrasse", "transat", "solarium", "vue atlas")) {
    return {
      reply: `Détente et soleil sont au rendez-vous dans nos Riads : 🏊‍♂️☀️

• 💦 **Bassin & Piscine de Patio** : Nos riads disposent d'un bassin d'agrément rafraîchissant situé au cœur du patio fleuri ou d'une piscine sur le toit.
• 🌅 **Terrasses Rooftop & Solarium** : De superbes toits-terrasses aménagés avec transats, parasols, coins salons ombragés et vue panoramique à 360° sur la médina et la chaîne de l'Atlas.
• 🍸 **Service Bar & Rafraîchissements** : Possibilité de déguster des jus de fruits frais pressés, cocktails sans alcool et thé à la menthe directement sur le rooftop.`,
      suggestions: [
        "Voir les riads avec piscine et spa",
        "Organiser un séjour détente à Marrakech",
        "Riads avec rooftop à Essaouira",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 17. SPA, HAMMAM, MASSAGE & BIEN-ÊTRE
  if (hasAny("spa", "hammam", "massage", "gommage", "soin", "bien etre", "relaxation", "savon noir", "rhassoul", "huile d argan", "argan")) {
    const spaRiads = riads.filter((r) => r.hasSpa || r.hasHammam);
    return {
      reply: `Découvrez le rituel ancestral du bien-être et de la beauté marocaine : 🧖‍♀️🌿

• 🧼 **Le Rituel du Hammam Traditionnel** : Bain de vapeur tiède et chaude, application de savon noir pur à l'huile d'olive et eucalyptus, gommage tonifiant au gant *Kessa*, puis enveloppement purifiant au *Rhassoul* parfumé à l'eau de rose.
• 💆 **Massages aux Huiles Précieuses** : Massages relaxants ou tonifiants à l'huile d'argan 100% bio certifiée, aromatisée à la fleur d'oranger ou verveine.
• 🕯️ **Espaces privatifs** : Possibilité de réserver le spa et hammam en exclusivité pour les couples ou les familles.`,
      riads: spaRiads.length > 0 ? spaRiads : riads.slice(0, 3),
      suggestions: [
        "Voir les riads avec Spa et Hammam",
        "Circuit Détente & Bien-être 4 jours",
        "Comment réserver une séance de massage ?",
      ],
    };
  }

  // 18. PETIT-DÉJEUNER & GASTRONOMIE
  if (hasAny("petit dejeuner", "petit-dejeuner", "dejeuner", "diner", "repas", "manger", "nourriture", "cuisine", "traiteur", "tajine", "couscous", "pastilla", "harira", "msemen", "baghrir", "the", "restaurant", "menu")) {
    const traiteurRiads = riads.filter((r) => r.hasTraiteur);
    return {
      reply: `La gastronomie marocaine en Riad est un véritable festin aux mille saveurs : 🍽️🍵

• ☀️ **Le Petit-Déjeuner Marocain (Inclus ou sur demande)** : Servi sur le rooftop ou au patio : *Msemen* (crêpes feuilletées croustillantes), *Baghrir* (crêpes aux mille trous), *Harcha* (galette de semoule dorée), miel pur, huile d'olive, *Amlou* traditionnel (pâte d'amandes grillées et huile d'argan), jus d'oranges pressées et thé à la menthe fraîche.
• 🍲 **Les Dîners à la Table d'Hôtes** :
  - *Tajine de poulet fermier aux citrons confits et olives violettes*
  - *Tajine d'agneau fondant aux pruneaux caramélisés et amandes grillées*
  - *Pastilla royale croustillante à la cannelle et fleur d'oranger*
  - *Couscous traditionnel aux 7 légumes le vendredi*
• 🥗 **Options végétariennes, sans gluten et halal** : Disponibles sur simple demande auprès de la cuisinière (*Dada*).`,
      riads: traiteurRiads.length > 0 ? traiteurRiads : riads.slice(0, 3),
      suggestions: [
        "Riads avec Table d'hôtes & Traiteur",
        "Comment réserver un dîner aux chandelles ?",
        "Cours de cuisine marocaine en riad",
      ],
    };
  }

  // 19. PAIEMENT, CARTE BANCAIRE & ESPÈCES
  if (hasAny("payer", "paiement", "carte bancaire", "carte bleue", "carte visa", "mastercard", "espece", "especes", "euro", "euros", "dollar", "caution", "acompte", "facture", "modalite de paiement")) {
    return {
      reply: `Modalités de règlement transparentes et flexibles : 💳💵

• 💵 **Paiement sur place à l'arrivée** : Règlement direct auprès du propriétaire de votre riad en espèces (Dirhams MAD ou Euros €) ou par carte bancaire.
• 💳 **Paiement en ligne sécurisé** : Règlement instantané et crypté par carte bancaire (Visa, Mastercard) via la plateforme MoroccoRiads.
• 🏛️ **Taxe de séjour légale** : Une modeste taxe locale de séjour (~25 à 30 MAD / ~2,50 € par personne et par nuit) est reversée directement à la commune et l'Office National Marocain du Tourisme.
• 🧾 **Facture & Reçu officiel** : Une facture détaillée vous est transmise pour chaque réservation.`,
      suggestions: [
        "Comment fonctionne l'annulation de séjour ?",
        "Créer un circuit 4 jours avec devis calculé",
        "Voir les riads disponibles",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 20. CULTURE & DIFFÉRENCE RIAD VS DAR
  if (hasAny("riad", "dar", "difference", "histoire", "architecture", "zellige", "patio", "moucharabieh", "tadelakt")) {
    return {
      reply: `Voici l'explication architecturale et historique de l'art de vivre marocain : 🏛️✨

• **Le Riad (de l'arabe *Ryad* signifiant 'Jardin arboré')** : Demeure seigneuriale traditionnelle bâtie autour d'un grand patio central à ciel ouvert avec orangers, citronniers, fontaine en marbre ou bassin. Les coursives intérieures sont parées de plâtre ciselé, de zellij artisanal et de plafonds en cèdre peint (*Zouak*).
• **Le Dar (signifiant 'Maison')** : Maison de médina également articulée autour d'une cour centrale intérieure pour préserver la fraîcheur et l'intimité familiale, mais sans jardin planté en pleine terre.

Sur **MoroccoRiads**, nos établissements sont rigoureusement certifiés pour leur authenticité architecturale et leur confort haut de gamme.`,
      suggestions: [
        "Voir nos plus beaux Riads authentiques",
        "Quels riads ont une piscine dans le patio ?",
        "Découvrir les riads historiques de Fès",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 21. CLIMAT & SAISONS
  if (hasAny("meteo", "climat", "periode", "quand partir", "quand visiter", "saison", "temperature", "soleil", "chaleur", "froid", "hiver", "ete", "printemps", "automne")) {
    return {
      reply: `Voici le guide climatique et saisonnier pour planifier au mieux votre venue au Maroc : ☀️🌤️

• 🌸 **Printemps (Mars à Mai - Idéal)** : Températures idéales (20°C à 27°C), nature en fleurs, journées ensoleillées parfaites pour visiter les médinas de Marrakech et Fès.
• 🍂 **Automne (Septembre à Novembre - Idéal)** : Climat très doux, excellente luminosité et mer agréable sur la côte atlantique.
• ❄️ **Hiver (Décembre à Février)** : Journées lumineuses (18°C à 22°C) avec soirées fraîches. Tous nos riads sont pourvus de climatisation réversible et souvent de cheminées.
• 🌊 **Été (Juin à Août)** : Période idéale pour séjourner à **Essaouira** (24°C - 26°C grâce aux alizés océaniques), tandis qu'à Marrakech et Fès les heures chaudes s'apprécient au frais dans les patios ombragés avec piscine.`,
      suggestions: [
        "Découvrir les riads à Essaouira (brise marine)",
        "Riads avec piscine et climatisation",
        "Circuit combiné Marrakech + Essaouira",
      ],
      riads: essaouiraRiads.length > 0 ? essaouiraRiads : riads.slice(0, 3),
    };
  }

  // 22. TRANSPORTS & TAXIS
  if (hasAny("transport", "taxi", "aeroport", "navette", "train", "oncf", "gare", "transfert", "voiture", "parking", "deplacement")) {
    return {
      reply: `Voici tous les conseils pratiques pour vos déplacements au Maroc : 🚕✈️

• 🚖 **Petits Taxis urbains** : Couleur spécifique par ville (Beige à Marrakech, Rouge à Fès, Bleu à Essaouira). Le compteur kilométrique (*compteur*) est obligatoire en journée comme de nuit (+50% après 20h).
• 🚐 **Transferts Aéroport ⇄ Riad** : Les ruelles de la médina étant piétonnes, les propriétaires de riads organisent des navettes privées à l'aéroport avec un porteur de bagages dédié jusqu'au riad.
• 🚆 **Lignes ferroviaires (TGV Al Boraq & ONCF)** : Liaisons très confortables et rapides entre Casablanca, Tanger, Rabat et Marrakech.
• 🅿️ **Parkings gardés** : Situés aux portes principales des médinas (Bab Doukkala, Bab Boujeloud, etc.), sécurisés 24h/24 pour ~20 à 30 MAD par jour.`,
      suggestions: [
        "Comment réserver un transfert avec son riad ?",
        "Circuit Marrakech + Essaouira avec transfert",
        "Voir nos riads avec conciergerie 24/7",
      ],
      riads: riads.slice(0, 3),
    };
  }

  // 23. SOUKS & SHOPPING
  if (hasAny("souk", "achat", "shopping", "pourboire", "tapis", "artisanat", "cuir", "epice", "negocier", "marchander", "monnaie", "dirham", "change")) {
    return {
      reply: `Conseils pour vos achats et moments de vie dans les souks traditionnels : 🏺🛍️

• 🏷️ **Art de la Négociation** : Négocier est une tradition conviviale au Maroc. Engagez l'échange avec bienveillance autour d'un verre de thé offert, et proposez généralement 40% à 50% du prix initial pour convenir d'un prix juste pour les deux parties.
• 💰 **Monnaie (Dirham MAD) & Pourboires** : 1 Euro ≈ 10,8 MAD. Prévoyez toujours de petites coupures pour les pourboires usuels (~10 à 20 MAD pour un service, porteur ou guide).
• 🎨 **Spécialités par ville** : Cuir et tapis berbères à Marrakech, céramiques bleues et dinanderie à Fès, objets sculptés en bois de thuya et huile d'argan pure à Essaouira.`,
      suggestions: [
        "Riads au cœur des souks de Marrakech",
        "Riads historiques à Fès",
        "Comment payer sa réservation en riad ?",
      ],
      riads: kechRiads.slice(0, 3),
    };
  }

  // ---------------------------------------------------------
  // 24. MOTEUR UNIVERSEL SÉMANTIQUE (POUR TOUTE AUTRE QUESTION)
  // ---------------------------------------------------------
  const matchingRiads = riads.filter((r) => {
    const text = normalize(`${r.nom} ${r.ville} ${r.adresse} ${r.description}`);
    return q.words.some((w) => w.length >= 4 && text.includes(w));
  });

  const displayList = matchingRiads.length > 0 ? matchingRiads.slice(0, 3) : riads.slice(0, 3);

  return {
    reply: `Marhaban ! 🏰✨ Concernant votre question *"**${message}**"* :

En tant que Concierge Virtuelle de **MoroccoRiads**, je réponds à l'ensemble de vos demandes pour rendre votre séjour exceptionnel :

• 🛎️ **Conseil personnalisé** : Nous adaptons chaque recommandation à vos critères (dates, localisation, budget, services souhaités).
• 🏛️ **Riads de prestige** : Tous nos établissements sont authentiques, climatisés, équipés du Wi-Fi haut débit et situés dans les meilleurs quartiers historiques.
• 💬 **Assistance continue** : N'hésitez pas à me préciser si vous recherchez une ville en particulier (*Marrakech, Fès, Essaouira*), un équipement précis (*Spa, piscine, table d'hôtes*) ou une durée de voyage.

Voici notre sélection d'hébergements recommandés :`,
    riads: displayList,
    suggestions: [
      "📍 Marrakech",
      "📍 Fès",
      "📍 Essaouira",
      "🌴 Proposer un circuit combiné multi-villes (4 jours)",
      "💆 Riads avec Spa & Hammam traditionnel",
    ],
  };
}

// -------------------------------------------------------------
// POINT D'ENTRÉE POST API
// -------------------------------------------------------------
export async function POST(req) {
  try {
    const body = await req.json();
    const { message = "" } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json({
        reply: `Bonjour ! Je suis **Houda**, votre Concierge & Conceptrice de Voyage IA. Je suis ici pour vous organiser votre séjour sur mesure avec le devis en 1 clic ! 🏰✨\n\n🏙️ **Villes disponibles pour la réservation :**\nChoisissez une destination ci-dessous pour découvrir nos riads et leurs chambres disponibles :`,
        suggestions: [
          "📍 Marrakech",
          "📍 Fès",
          "📍 Essaouira",
          "🌴 Circuit combiné Marrakech + Essaouira (4 jours)",
          "💆 Riads avec Spa & Hammam",
        ],
      });
    }

    // 1. Chargement des données PostgreSQL
    const riads = await getLiveRiads();

    // 2. Traitement NLP symbolique (sans ML)
    const normalized = normalize(message);
    const queryData = analyzeQuery(normalized);

    // 3. Évaluation par la base de connaissances experte
    const result = evaluateKnowledgeBase(message, queryData, riads);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Erreur chat expert AI route:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'exécution du système expert." },
      { status: 500 }
    );
  }
}
