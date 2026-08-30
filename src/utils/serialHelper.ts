/**
 * Utility functions for Serial Number (각인번호) base pattern extraction & automatic sequence expansion
 */

/**
 * Extracts the base pattern string by removing trailing sequence/range indicators.
 * Note: The full project number (e.g. 'NN-NNNNN-2608-01') is retained as the base.
 * Only 3+ digit sequence suffixes (-001, -002, etc.) or range suffixes (-001~003) are stripped.
 * Examples:
 * - 'NN-NNNNN-2608-01' -> 'NN-NNNNN-2608-01' (Entire project number kept)
 * - 'NN-NNNNN-2608-01-001' -> 'NN-NNNNN-2608-01'
 * - 'NN-NNNNN-2608-01-001~003' -> 'NN-NNNNN-2608-01'
 * - 'PNT-BNSH650L-265-02' -> 'PNT-BNSH650L-265-02'
 * - 'NN-NNNNN-2608' -> 'NN-NNNNN-2608'
 */
export function extractSerialBase(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();

  // 1. Remove range suffix: -001~003, -01~05, -1~3, or ~003
  str = str.replace(/-\d+\s*~\s*\d+$/, '');
  str = str.replace(/\s*~\s*\d+$/, '');

  // 2. Remove trailing 3 or 4-digit sequence index added by generator: -001, -002, etc.
  // Note: We only strip if 3+ digits (e.g., -001), so 2-digit project sub-numbers like -01, -02 are preserved!
  str = str.replace(/-\d{3,4}$/, '');

  return str.trim() || raw.trim();
}

/**
 * Format full serial range display string for an order based on quantity.
 * Examples:
 * - formatSerialRange('NN-NNNNN-2608-01', 1) -> 'NN-NNNNN-2608-01-001'
 * - formatSerialRange('NN-NNNNN-2608-01', 3) -> 'NN-NNNNN-2608-01-001~003'
 * - formatSerialRange('NN-NNNNN-2608-01-001~003', 3) -> 'NN-NNNNN-2608-01-001~003'
 */
export function formatSerialRange(raw: string, qty: number): string {
  if (!raw || !raw.trim()) return '';
  const base = extractSerialBase(raw);
  const validQty = Math.max(1, qty || 1);

  if (validQty === 1) {
    return `${base}-001`;
  }
  const endPad = String(validQty).padStart(3, '0');
  return `${base}-001~${endPad}`;
}

/**
 * Get individual serial number for a specific product piece/unit (1-based index).
 * Examples:
 * - getIndividualSerialNo('NN-NNNNN-2608-01', 1) -> 'NN-NNNNN-2608-01-001'
 * - getIndividualSerialNo('NN-NNNNN-2608-01', 2) -> 'NN-NNNNN-2608-01-002'
 * - getIndividualSerialNo('NN-NNNNN-2608-01', 3) -> 'NN-NNNNN-2608-01-003'
 * - getIndividualSerialNo('NN-NNNNN-2608-01-001~003', 2) -> 'NN-NNNNN-2608-01-002'
 */
export function getIndividualSerialNo(raw: string, pieceNumber: number = 1, _totalQty?: number): string {
  const safePiece = Math.max(1, pieceNumber || 1);
  const pad = String(safePiece).padStart(3, '0');

  if (!raw || !raw.trim()) {
    return `SN-${pad}`;
  }

  const base = extractSerialBase(raw);
  return `${base}-${pad}`;
}

/**
 * Generate an array of all individual serial numbers for a given base and quantity.
 * Example:
 * getSerialNoList('NN-NNNNN-2608-01', 3)
 * -> ['NN-NNNNN-2608-01-001', 'NN-NNNNN-2608-01-002', 'NN-NNNNN-2608-01-003']
 */
export function getSerialNoList(raw: string, qty: number): string[] {
  const count = Math.max(1, qty || 1);
  const list: string[] = [];
  for (let i = 1; i <= count; i++) {
    list.push(getIndividualSerialNo(raw, i, count));
  }
  return list;
}
