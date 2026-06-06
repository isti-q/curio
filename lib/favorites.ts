import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@curio/favorites";

/** Returns the saved fact ids, newest first. */
export async function getFavorites(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function isFavorite(id: string): Promise<boolean> {
  const ids = await getFavorites();
  return ids.includes(id);
}

async function save(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export async function addFavorite(id: string): Promise<void> {
  const ids = await getFavorites();
  if (!ids.includes(id)) await save([id, ...ids]);
}

export async function removeFavorite(id: string): Promise<void> {
  const ids = await getFavorites();
  await save(ids.filter((x) => x !== id));
}

/** Toggles a fact's saved state and returns the new state (true = saved). */
export async function toggleFavorite(id: string): Promise<boolean> {
  const ids = await getFavorites();
  if (ids.includes(id)) {
    await save(ids.filter((x) => x !== id));
    return false;
  }
  await save([id, ...ids]);
  return true;
}
