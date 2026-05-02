import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { useVault } from "./useVault";

export function useAppActions(
  setToast: (toast: { message: string, type: "success" | "error" } | null) => void,
  auth: ReturnType<typeof useAuth>,
  vault: ReturnType<typeof useVault>
) {
  const router = useRouter();
  const { login, register, logout, setError: setAuthError } = auth;
  const { unlock, unlockWithRecovery, create, sync, reset, setError: setVaultError } = vault;

  const handleLogin = async (email: string, password: string, twoFactorToken?: string) => {
    try {
      await login(email, password, twoFactorToken);
      await sync();
      await unlock(password);
      setToast({ message: "Welcome back!", type: "success" });
      router.push("/dashboard");
    } catch (err: any) {
      if (!err.requires2FA) setAuthError(err.message);
      throw err;
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      console.log("Starting registration for:", email);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      console.log("Generated salt, calling register...");
      await register(email, password, salt);
      console.log("Server registration successful, creating local vault...");
      await create(password, salt);
      console.log("Local vault created, logging in...");
      await login(email, password);
      console.log("Login successful, syncing...");
      await sync();
      setToast({ message: "Account created!", type: "success" });
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration failed:", err);
      setAuthError(err.message || "Registration failed");
    }
  };

  const handleUnlock = async (password: string) => {
    try {
      await unlock(password);
      setToast({ message: "Vault unlocked!", type: "success" });
      router.push("/dashboard");
    } catch (err: any) {
      setVaultError(err.message);
    }
  };

  const handleRecover = async (key: string, data: any) => {
    try {
      await unlockWithRecovery(key, data);
      setToast({ message: "Vault recovered!", type: "success" });
      router.push("/dashboard");
    } catch (err: any) {
      setVaultError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleResetAndLogout = async () => {
    if (typeof window !== "undefined" && confirm("This will permanently delete your locally stored vault data. You will need to login and sync from cloud again. Proceed?")) {
      try {
        await reset(); 
        await logout(); 
      } finally {
        router.push("/login"); 
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
