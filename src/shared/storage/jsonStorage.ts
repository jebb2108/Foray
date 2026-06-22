export interface VersionedEnvelope<T> {
  schemaVersion: number;
  data: T;
}

export function readJsonStorage(key: string): unknown {
  try {
    const value = localStorage.getItem(key);
    return value === null ? null : JSON.parse(value);
  } catch {
    // Ошибка чтения не должна блокировать запуск приложения
    return null;
  }
}

export function writeJsonStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Интерфейс продолжает работать с состоянием в памяти
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Хранилище может быть недоступно в приватном режиме
  }
}

export function createEnvelope<T>(
  schemaVersion: number,
  data: T,
): VersionedEnvelope<T> {
  return { schemaVersion, data };
}
