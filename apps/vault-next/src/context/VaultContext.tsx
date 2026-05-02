"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVault } from "@/hooks/useVault";
import { useAppActions } from "@/hooks/useAppActions";
import { Toast } from "@pwmnger/ui";

interface VaultContextType {
  auth: ReturnType<typeof useAuth>;
  vault: ReturnType<typeof useVault>;
  actions: ReturnType<typeof useAppActions>;
  toast: { message: string; type: "success" | "error" } | null;
  setToast: (toast: { message: string; type: "success" | "error" } | null) => void;
}

const VaultContext = createContext<VaultContextType | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const auth = useAuth();
  const vault = useVault();
  const actions = useAppActions(setToast, auth, vault);

  return (
    <VaultContext.Provider value={{ auth, vault, actions, toast, setToast }}>
      {children}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </VaultContext.Provider>
  );
}

export function useVaultContext() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVaultContext must be used within a VaultProvider");
  }
  return context;
}
