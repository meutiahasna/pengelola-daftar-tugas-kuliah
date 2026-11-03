// Fungsi Utilitas LocalStorage pake Generics Sederhana

/**
 * Fungsi Generic untuk menyimpan data ke LocalStorage
 * @template T Tipe data generik yang akan disimpan
 */

export function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Fungsi Generic untuk mengambil data dari LocalStorage
 * @template T Tipe data generik yang dikembalikan
 */

export function getFromStorage<T>(key: string, fallback: T): T {
  const data = localStorage.getItem(key);
  return data ? (JSON.parse(data) as T) : fallback;
}