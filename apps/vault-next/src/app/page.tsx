"use client";

import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/Landing/LandingPage";
import { useVaultContext } from "@/context/VaultContext";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { auth } = useVaultContext();

  return (
    <LandingPage 
      onLogin={() => router.push(auth.session ? "/dashboard" : "/login")} 
      onRegister={() => router.push(auth.session ? "/dashboard" : "/register")} 
    />
  );
}
