import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toast } from "@pwmnger/ui";
import { checkVaultExists } from "@pwmnger/app-logic";

import { useAuth } from "./hooks/useAuth";
import { useVault } from "./hooks/useVault";
import { useAppActions } from "./hooks/useAppActions";
import { ProtectedRoute, PublicRoute } from "./components/Shared/RouteGuards";

import "./App.css";

const UnlockVault = lazy(() => import("./components/Vault/UnlockVault").then(m => ({ default: m.UnlockVault })));
const RegisterVault = lazy(() => import("./components/Vault/RegisterVault").then(m => ({ default: m.RegisterVault })));
const LoginForm = lazy(() => import("./components/Vault/LoginForm").then(m => ({ default: m.LoginForm })));
const VaultDashboard = lazy(() => import("./components/Vault/VaultDashboard").then(m => ({ default: m.VaultDashboard })));
const LandingPage = lazy(() => import("./components/Landing/LandingPage").then(m => ({ default: m.LandingPage })));

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="loader">Shielding...</div>
  </div>
);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { session, isAuthAction, error: authError, is2FAEnabled, update2FAStatus } = useAuth();
  const { vault, isSyncing, isUnlocking, error: vaultError, sync, addEntry, deleteEntry, updateEntry, importData, createFolder, deleteFolder, moveEntry, downloadRecoveryKit, lock } = useVault();
  const { handleLogin, handleRegister, handleUnlock, handleRecover, handleResetAndLogout } = useAppActions(setToast);
  
  const [loading, setLoading] = useState(true);
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);

  useEffect(() => {
    async function init() {
      await update2FAStatus();
      const exists = await checkVaultExists();
      setVaultExists(exists);
      setLoading(false);
    }
    init();
  }, [update2FAStatus]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="app-main">
      <div className="mesh-glow" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={
            <PublicRoute isAuthenticated={!!session} isVaultUnlocked={!!vault} vaultExists={vaultExists}>
              <LandingPage onLogin={() => navigate("/login")} onRegister={() => navigate("/register")} />
            </PublicRoute>
          } />
          
          <Route path="/login" element={
            <PublicRoute isAuthenticated={!!session} isVaultUnlocked={!!vault} vaultExists={vaultExists}>
              <div className="auth-container">
                <div className="animate-fade-in shadow-2xl">
                  <LoginForm 
                    onLogin={handleLogin} 
                    onGoToRegister={() => navigate("/register")} 
                    error={authError} 
                    loading={isAuthAction} 
                  />
                </div>
              </div>
            </PublicRoute>
          } />

          <Route path="/register" element={
            <PublicRoute isAuthenticated={!!session} isVaultUnlocked={!!vault} vaultExists={vaultExists}>
              <div className="auth-container">
                <div className="animate-fade-in shadow-2xl">
                  <RegisterVault 
                    onRegister={handleRegister} 
                    onGoToLogin={() => navigate("/login")} 
                    error={authError} 
                    loading={isAuthAction} 
                  />
                </div>
              </div>
            </PublicRoute>
          } />

          <Route path="/unlock" element={
            session ? (
              <div className="auth-container">
                <div className="animate-fade-in shadow-2xl">
                  <UnlockVault 
                    onUnlock={handleUnlock} 
                    onRecover={handleRecover} 
                    error={vaultError} 
                    loading={isUnlocking} 
                  />
                </div>
                <p className="reset-data-link animate-fade-in">
                  <span onClick={handleResetAndLogout}>
                    Switch Account / Reset Local Data
                  </span>
                </p>
              </div>
            ) : <Navigate to="/login" />
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute isAuthenticated={!!session} isVaultUnlocked={!!vault} vaultExists={vaultExists}>
              <div className="dashboard-wrapper">
                <VaultDashboard
                  vault={vault!}
                  userEmail={session?.email || ""}
                  onSync={async () => {
                    try {
                      await sync();
                      setToast({ message: "Sync successful!", type: "success" });
                    } catch (err: any) {
                      setToast({ message: err.message || "Sync failed", type: "error" });
                    }
                  }}
                  onLock={() => { lock(); navigate("/unlock"); }}
                  onAddEntry={addEntry}
                  onDeleteEntry={deleteEntry}
                  onCreateFolder={createFolder}
                  onDeleteFolder={deleteFolder}
                  onMoveEntry={moveEntry}
                  onEditEntry={updateEntry}
                  onImportVault={importData}
                  onDownloadRecoveryKit={downloadRecoveryKit}
                  onRefreshAccountStatus={update2FAStatus}
                  isSyncing={isSyncing}
                  is2FAEnabled={is2FAEnabled}
                />
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>

      {location.pathname !== "/dashboard" && location.pathname !== "/" && (
        <footer className="app-footer">
          <div className="footer-text">
            &copy; 2026 PwmngerTS &bull; Distributed Zero-Knowledge Storage
          </div>
        </footer>
      )}
    </div>
  );
}
