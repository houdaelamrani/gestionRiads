"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProprietaireIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/proprietaire/riads");
  }, [router]);

  return null;
}
