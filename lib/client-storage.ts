import type { Destination } from "@/lib/types";

const DB_NAME = "fishing-travel-planner";
const DB_VERSION = 1;
const STORE_NAME = "app-state";
const DESTINATIONS_KEY = "destinations";

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadStoredDestinations() {
  const database = await openDatabase();

  if (!database) {
    return null;
  }

  return new Promise<Destination[] | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(DESTINATIONS_KEY);

    request.onsuccess = () => {
      const result = request.result;
      resolve(Array.isArray(result) ? (result as Destination[]) : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveStoredDestinations(destinations: Destination[]) {
  const database = await openDatabase();

  if (!database) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(destinations, DESTINATIONS_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
