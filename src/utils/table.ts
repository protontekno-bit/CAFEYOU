/**
 * Utilitas Normalisasi dan Validasi Nama Meja Kafe
 * Memastikan perbandingan meja (isSameTable) akurat terhadap berbagai variasi format input
 * (contoh: "1", "01", "Meja 1", "meja 01", "Table 1", "VIP 1").
 */

/**
 * Melakukan normalisasi string meja menjadi format standar "Meja X" jika merupakan angka meja.
 */
export const normalizeTable = (table?: string | null): string => {
  if (!table) return '';
  const clean = table.trim();
  // Tangkap angka jika diawali kata meja/table/tbl/m/t atau hanya angka murni
  const match = clean.match(/^(?:meja|table|tbl|m|t)?\s*0*(\d+)$/i);
  if (match) {
    return `Meja ${match[1]}`;
  }
  return clean;
};

/**
 * Memeriksa apakah dua referensi meja merujuk ke meja fisik yang sama.
 * Bersifat case-insensitive dan kebal terhadap perbedaan prefix/leading zero.
 */
export const isSameTable = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  const normA = normalizeTable(a).toLowerCase();
  const normB = normalizeTable(b).toLowerCase();
  if (normA === normB) return true;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
};
