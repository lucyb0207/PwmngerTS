import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useVault } from "./useVault";

export function useAppActions(setToast: (toast: { message: string, type: "success" | "error" } | null) => void) {
  const navigate = useNavigate();
  const { login, register, logout, setError: setAuthError } = useAuth();
  const { unlock, unlockWithRecovery, create, sync, reset, setError: setVaultError } = useVault();

  const handleLogin = async (email: string, password: string, twoFactorToken?: string) => {
    try {
      await login(email, password, twoFactorToken);
      await sync();
      await unlock(password);
      setToast({ message: "Welcome back!", type: "success" });
      navigate("/dashboard");
    } catch (err: any) {
      if (!err.requires2FA) setAuthError(err.message);
      throw err;
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      await register(email, password);
      await create(password); 
      await login(email, password);
      await sync();
      setToast({ message: "Account created!", type: "success" });
      navigate("/dashboard");
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleUnlock = async (password: string) => {
    try {
      await unlock(password);
      setToast({ message: "Vault unlocked!", type: "success" });
      navigate("/dashboard");
    } catch (err: any) {
      setVaultError(err.message);
    }
  };

  const handleRecover = async (key: string, data: any) => {
    try {
      await unlockWithRecovery(key, data);
      setToast({ message: "Vault recovered!", type: "success" });
      navigate("/dashboard");
    } catch (err: any) {
      setVaultError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleResetAndLogout = async () => {
    if (confirm("This will permanently delete your locally stored vault data. You will need to login and sync from cloud again. Proceed?")) {
      try {
        await reset(); 
        await logout(); 
      } finally {
        navigate("/login"); 
      }
    }
  };

  return {
    handleLogin,
    handleRegister,
    handleUnlock,
    handleRecover,
    handleLogout,
    handleResetAndLogout
  };
}
