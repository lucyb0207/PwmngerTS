"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RegisterVault } from "@/components/Vault/RegisterVault";
import { useVaultContext } from "@/context/VaultContext";

export default function RegisterPage() {
  const router = useRouter();
  const { auth, actions } = useVaultContext();
  const { handleRegister } = actions;

  return (
    <div className="auth-container">
      <div className="mesh-glow" />
      <div className="animate-fade-in shadow-2xl">
        <RegisterVault 
          onRegister={handleRegister} 
          onGoToLogin={() => router.push("/login")} 
          error={auth.error} 
          loading={auth.isAuthAction} 
        />
      </div>
    </div>
  );
}
