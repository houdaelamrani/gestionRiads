"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook centralisé pour la gestion de l'authentification.
 * Lit le user depuis le localStorage et expose :
 *  - currentUser : objet user ou null
 *  - isLoading : boolean
 *  - logout() : déconnexion + redirection
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error("Erreur lors de la lecture du localStorage:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setCurrentUser(null);
    router.push("/");
  }, [router]);

  return { currentUser, isLoading, logout };
}
