/**
 * Utility functions for Serial Number (각인번호) base pattern extraction & automatic sequence expansion
 * 
 * Rules:
 * - Serial No. = [Full Project Number (프로젝트번호 전체)] + "-" + [Sequence Number (001~n)]
 * - The full project number string must never be truncated or split arbitrarily.
 * - Examples:
 *   - Project Number: '123-123123-1231', Qty: 1 -> '123-123123-1231-001'
 *   - Project Number: '123-123123-1231', Qty: 3 -> '123-123123-1231-001~003'
 *   - Individual Piece 1: '123-123123-1231-001'
 *   - Individual Piece 2: '123-123123-1231-002'
 *   - Individual Piece 3: '123-123123-1231-003'
 */

/**
 * Extracts the base pattern string (project number or custom prefix) by only removing
 * explicitly generated sequence/range suffixes like '-001~003' or trailing '-001' attached to it.
 * 
 * CRITICAL FIX:
 * Project numbers like '123-123123-1231' (ending in 4 digits) or 'PRJ-2026-001' must NOT be truncated!
 */
export function extractSerialBase(raw: string, explicitProjectNo?: string): string {
  if (!raw || !raw.trim()) {
    return explicitProjectNo?.trim() || '';
  }

  let str = raw.trim();

  // If explicit project number is provided and raw starts with it, retain that project number exactly
  if (explicitProjectNo && explicitProjectNo.trim()) {
    const pjt = explicitProjectNo.trim();
    if (str === pjt) {
      return pjt;
    }
    if (str.startsWith(pjt)) {
      const remainder = str.slice(pjt.length);
      // Remainder must be something like "-001", "-001~003", "-001~05", etc.
      if (!remainder || /^-\d{1,4}(\s*~\s*\d{1,4})?$/.test(remainder)) {
        return pjt;
      }
    }
  }

  // 1. Remove range suffix: -001~003, -01~05, -1~3, or ~003
  if (/-\d+\s*~\s*\d+$/.test(str)) {
    return str.replace(/-\d+\s*~\s*\d+$/, '').trim();
  }
  if (/\s*~\s*\d+$/.test(str)) {
    return str.replace(/\s*~\s*\d+$/, '').trim();
  }

  // 2. Only remove trailing 3-digit sequence (-001, -002, etc.) IF there is a preceding hyphen and prefix
  // Do NOT strip 4-digit numbers like -1231 (which was the bug).
  // E.g., '123-123123-1231-001' -> prefix is '123-123123-1231', suffix is '-001' -> returns '123-123123-1231'
  if (/^.+-\d{3}$/.test(str)) {
    return str.replace(/-\d{3}$/, '').trim();
  }

  return str;
}

/**
 * Format full serial range display string for an order based on quantity and project number.
 * 
 * Examples:
 * - formatSerialRange('123-123123-1231', 1) -> '123-123123-1231-001'
 * - formatSerialRange('123-123123-1231', 3) -> '123-123123-1231-001~003'
 * - formatSerialRange('123-123123-1231-001~003', 3) -> '123-123123-1231-001~003'
 */
export function formatSerialRange(raw: string, qty: number, explicitProjectNo?: string): string {
  if (!raw || !raw.trim()) {
    if (explicitProjectNo && explicitProjectNo.trim()) {
      return formatSerialRange(explicitProjectNo.trim(), qty);
    }
    return '';
  }

  const base = extractSerialBase(raw, explicitProjectNo);
  const validQty = Math.max(1, qty || 1);

  if (validQty === 1) {
    return `${base}-001`;
  }
  const endPad = String(validQty).padStart(3, '0');
  return `${base}-001~${endPad}`;
}

/**
 * Get individual serial number for a specific product piece/unit (1-based index).
 * 
 * Examples:
 * - getIndividualSerialNo('123-123123-1231', 1) -> '123-123123-1231-001'
 * - getIndividualSerialNo('123-123123-1231', 2) -> '123-123123-1231-002'
 * - getIndividualSerialNo('123-123123-1231', 3) -> '123-123123-1231-003'
 * - getIndividualSerialNo('123-123123-1231-001~003', 2) -> '123-123123-1231-002'
 */
export function getIndividualSerialNo(raw: string, pieceNumber: number = 1, _totalQty?: number, explicitProjectNo?: string): string {
  const safePiece = Math.max(1, pieceNumber || 1);
  const pad = String(safePiece).padStart(3, '0');

  if (!raw || !raw.trim()) {
    if (explicitProjectNo && explicitProjectNo.trim()) {
      return `${explicitProjectNo.trim()}-${pad}`;
    }
    return `SN-${pad}`;
  }

  const base = extractSerialBase(raw, explicitProjectNo);
  return `${base}-${pad}`;
}

/**
 * Generate an array of all individual serial numbers for a given base and quantity.
 * 
 * Example:
 * getSerialNoList('123-123123-1231', 3)
 * -> ['123-123123-1231-001', '123-123123-1231-002', '123-123123-1231-003']
 */
export function getSerialNoList(raw: string, qty: number, explicitProjectNo?: string): string[] {
  const count = Math.max(1, qty || 1);
  const list: string[] = [];
  for (let i = 1; i <= count; i++) {
    list.push(getIndividualSerialNo(raw, i, count, explicitProjectNo));
  }
  return list;
}

