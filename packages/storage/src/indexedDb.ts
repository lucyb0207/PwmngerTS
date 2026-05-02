const DB_NAME = "pwmnger-db";
const STORE_NAME = "vault";
const DB_VERSION = 2;

import type { EncryptedPayload } from "@pwmnger/crypto";
import {
  getMemoryAuthToken,
  setMemoryAuthToken,
} from "./memoryAuthToken";

type StoredVault = {
  salt: number[];
  encryptedVault: EncryptedPayload;
  encryptedVaultKey: EncryptedPayload;
  updatedAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

/** @internal - For testing use only */
export function __resetDB() {
  dbPromise = null;
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    console.log("IndexedDB: Opening database...");
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      console.log("IndexedDB: Upgrade needed, creating store...");
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      console.log("IndexedDB: Database opened successfully");
      resolve(request.result);
    };
    request.onerror = () => {
      console.error("IndexedDB: Error opening database", request.error);
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// @ts-ignore - chrome is available in extension environment
const _chrome = (globalThis as any).chrome;

export async function saveVault(data: StoredVault): Promise<void> {
  // Auto-detect Chrome Extension environment
  if (typeof _chrome !== "undefined" && _chrome.storage && _chrome.storage.local) {
    console.log("Storage: Using chrome.storage.local");
    return new Promise((resolve, reject) => {
      _chrome.storage.local.set({ pwmnger_vault: data }, () => {
        if (_chrome.runtime.lastError) reject(_chrome.runtime.lastError);
        else resolve();
      });
    });
  }

  console.log("IndexedDB: Saving vault...");
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data, "main");

    request.onsuccess = () => {
      console.log("IndexedDB: Vault saved successfully to 'main'");
      resolve();
    };
    tx.oncomplete = () => {
      console.log("IndexedDB: Transaction completed");
    };
    tx.onerror = () => {
      console.error("IndexedDB: Transaction error during save", tx.error);
      reject(tx.error);
    };
    request.onerror = () => {
      console.error("IndexedDB: Request error during save", request.error);
      reject(request.error);
    };
  });
}

export async function loadVault(): Promise<StoredVault | null> {
  // Auto-detect Chrome Extension environment
  if (typeof _chrome !== "undefined" && _chrome.storage && _chrome.storage.local) {
    console.log("Storage: Loading from chrome.storage.local");
    return new Promise((resolve) => {
      _chrome.storage.local.get("pwmnger_vault", (result: any) => {
        resolve(result.pwmnger_vault ?? null);
      });
    });
  }

  console.log("IndexedDB: Loading vault...");
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get("main");

    request.onsuccess = () => {
      console.log(
        "IndexedDB: Load request successful",
        request.result ? "data found" : "no data found",
      );
      resolve(request.result ?? null);
    };
    request.onerror = () => {
      console.error("IndexedDB: Error loading vault", request.error);
      reject(request.error);
    };
  });
}

export async function saveAuthToken(token: string): Promise<void> {
  setMemoryAuthToken(token);
}

export async function loadAuthToken(): Promise<string | null> {
  return getMemoryAuthToken();
}

export async function clearVault(): Promise<void> {
  if (typeof _chrome !== "undefined" && _chrome.storage && _chrome.storage.local) {
    return new Promise((resolve, reject) => {
      _chrome.storage.local.remove("pwmnger_vault", () => {
        if (_chrome.runtime.lastError) reject(_chrome.runtime.lastError);
        else resolve();
      });
    });
  }

  console.log("IndexedDB: Clearing vault...");
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete("main");

    request.onsuccess = () => {
      console.log("IndexedDB: Vault cleared successfully");
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    request.onerror = () => reject(request.error);
  });
}

export async function clearAuthToken(): Promise<void> {
  setMemoryAuthToken(null);

  // Best-effort cleanup for tokens persisted by older versions.
  if (typeof _chrome !== "undefined" && _chrome.storage && _chrome.storage.local) {
    return new Promise((resolve) => {
      _chrome.storage.local.remove("pwmnger_token", () => resolve(void 0));
    });
  }
}
