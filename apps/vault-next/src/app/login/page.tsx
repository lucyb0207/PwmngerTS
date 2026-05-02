"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/Vault/LoginForm";
import { useVaultContext } from "@/context/VaultContext";

export default function LoginPage() {
  const router = useRouter();
  const { auth, actions } = useVaultContext();
  const { handleLogin } = actions;

  return (
    <div className="auth-container">
      <div className="mesh-glow" />
      <div className="animate-fade-in shadow-2xl">
        <LoginForm 
          onLogin={handleLogin} 
          onGoToRegister={() => router.push("/register")} 
          error={auth.error} 
          loading={auth.isAuthAction} 
        />
      </div>
    </div>
  );
}
