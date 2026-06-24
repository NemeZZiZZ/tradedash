import { useCallback, useState } from "react";

const PREFIX = "tradedash:";

export function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function savePersisted<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable / quota */
  }
}

/** `useState` mirrored to localStorage under the `tradedash:` namespace. */
export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => loadPersisted(key, fallback));

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        savePersisted(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, set] as const;
}
