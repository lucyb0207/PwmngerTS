import { useState, useCallback } from "react";
import { loginAccount, registerAccount, getAccountStatus, logoutAccount } from "@pwmnger/app-logic";

export function useAuth() {
  const [isAuthAction, setIsAuthAction] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<{ email: string } | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const update2FAStatus = useCallback(async () => {
    try {
      const status = await getAccountStatus();
      setIs2FAEnabled(status.is2FAEnabled);
      setSession({ email: status.email });
    } catch {
      setSession(null);
    }
  }, []);

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    setIsAuthAction(true);
    setError("");
    try {
      await loginAccount(email, password, twoFactorToken);
      setSession({ email });
      await update2FAStatus();
      return { email };
    } catch (err: any) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setIsAuthAction(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    kdfSalt: Uint8Array,
  ) => {
    setIsAuthAction(true);
    setError("");
    try {
      await registerAccount(email, password, kdfSalt);
    } catch (err: any) {
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setIsAuthAction(false);
    }
  };

  const logout = async () => {
    await logoutAccount();
    setSession(null);
    setIs2FAEnabled(false);
  };

  return {
    session,
    isAuthAction,
    error,
    is2FAEnabled,
    login,
    register,
    logout,
    update2FAStatus,
    setError
  };
}
