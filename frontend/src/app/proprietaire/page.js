"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProprietaireIndex() {
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.role === "PROPRIETAIRE" || u.role === "ADMIN") {
          router.push("/proprietaire/dashboard");
          return;
        }
      } catch (e) {
        // En cas d'erreur de parse
      }
    }
    router.push("/login");
  }, [router]);

  return null;
}
