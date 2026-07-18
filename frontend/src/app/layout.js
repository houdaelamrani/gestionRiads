import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../lib/LanguageContext";
import Chatbot from "../components/Chatbot";
import MessagingSimulator from "../components/MessagingSimulator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MoroccoRiads - Réservation de Riads d'exception au Maroc",
  description: "Plateforme premium de réservation de Riads traditionnels au Maroc. Réservez votre séjour de rêve à Marrakech, Fès, Essaouira et vivez une expérience unique.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <LanguageProvider>
          {children}
          <Chatbot />
          <MessagingSimulator />
        </LanguageProvider>
      </body>
    </html>
  );
}


