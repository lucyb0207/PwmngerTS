"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UnlockVault } from "@/components/Vault/UnlockVault";
import { useVaultContext } from "@/context/VaultContext";

export default function UnlockPage() {
  const router = useRouter();
  const { vault, actions } = useVaultContext();
  const { handleUnlock, handleRecover, handleResetAndLogout } = actions;

  return (
    <div className="auth-container">
      <div className="mesh-glow" />
      <div className="animate-fade-in shadow-2xl">
        <UnlockVault 
          onUnlock={handleUnlock} 
          onRecover={handleRecover} 
          error={vault.error} 
          loading={vault.isUnlocking} 
        />
      </div>
      <p className="reset-data-link animate-fade-in">
        <span onClick={handleResetAndLogout} style={{ cursor: "pointer", color: "var(--text-dim)", textDecoration: "underline" }}>
          Switch Account / Reset Local Data
        </span>
      </p>
    </div>
  );
}
