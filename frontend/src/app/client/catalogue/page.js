"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClientCatalogue() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/#riads");
  }, [router]);

  return null;
}
