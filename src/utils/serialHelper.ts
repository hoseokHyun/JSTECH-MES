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
 * 
 *   - Project Number: '123-123-131', Qty: 1 -> '123-123-131-001'
 *   - Project Number: '123-123-123', Qty: 3 -> '123-123-123-001~003'
 */

/**
 * Extracts the base pattern string (project number or custom prefix) by only removing
 * explicitly generated sequence/range suffixes like '-001~003' or trailing '-001' attached to it.
 * 
 * CRITICAL RULE:
 * - Project numbers like '123-123123-1231' or '123-123-131' or '123-123-123' must NEVER be truncated!
 * - Never strip the last digits of a project number.
 */
export function extractSerialBase(raw: string, explicitProjectNo?: string): string {
  if (!raw || !raw.trim()) {
    return explicitProjectNo?.trim() || '';
  }

  const str = raw.trim();
  const pjt = explicitProjectNo?.trim();

  // 1. If explicit project number is provided and non-empty:
  if (pjt) {
    // If raw is exactly the project number, return it as-is without any modification
    if (str === pjt) {
      return pjt;
    }
    // If raw starts with project number + hyphen (e.g. '123-123-131-001' or '123-123-131-001~003')
    if (str.startsWith(`${pjt}-`)) {
      return pjt;
    }
    // If raw starts with project number
    if (str.startsWith(pjt)) {
      const remainder = str.slice(pjt.length);
      if (!remainder || /^-\d{1,4}(\s*~\s*\d{1,4})?$/.test(remainder)) {
        return pjt;
      }
    }
  }

  // 2. Remove explicit range suffix: -001~003, -01~05, -1~3, or ~003
  if (/-\d{1,4}\s*~\s*\d{1,4}$/.test(str)) {
    return str.replace(/-\d{1,4}\s*~\s*\d{1,4}$/, '').trim();
  }
  if (/\s*~\s*\d{1,4}$/.test(str)) {
    return str.replace(/\s*~\s*\d{1,4}$/, '').trim();
  }

  // 3. Fallback: Only remove trailing sequence if formatted as a generated serial sequence (e.g. -001, -002)
  // after an existing multi-segment identifier.
  // Note: We DO NOT blindly strip '-\d{3}' because project numbers like '123-123-131' or '123-123-123' end in 3 digits.
  if (/^.+-(00[1-9]|0[1-9]\d|\d{3,4})$/.test(str)) {
    const lastHyphenIndex = str.lastIndexOf('-');
    if (lastHyphenIndex > 0) {
      const prefix = str.slice(0, lastHyphenIndex);
      const suffix = str.slice(lastHyphenIndex + 1);
      // Only strip if suffix starts with '00' (standard generated sequence 001~009) AND prefix itself contains a hyphen
      if (/^00[1-9]$/.test(suffix) && prefix.includes('-')) {
        return prefix;
      }
    }
  }

  return str;
}

/**
 * Format full serial range display string for an order based on quantity and project number.
 * 
 * Examples:
 * - formatSerialRange('123-123123-1231', 1) -> '123-123123-1231-001'
 * - formatSerialRange('123-123123-1231', 3) -> '123-123123-1231-001~003'
 * - formatSerialRange('123-123-131', 1) -> '123-123-131-001'
 * - formatSerialRange('123-123-131', 3) -> '123-123-131-001~003'
 */
export function formatSerialRange(raw: string, qty: number, explicitProjectNo?: string): string {
  const pjt = explicitProjectNo?.trim();
  const rawStr = raw?.trim() || '';

  if (!rawStr) {
    if (pjt) {
      return formatSerialRange(pjt, qty, pjt);
    }
    return '';
  }

  let base: string;
  if (pjt) {
    if (rawStr === pjt || rawStr.startsWith(`${pjt}-`)) {
      base = pjt;
    } else {
      base = extractSerialBase(rawStr, pjt) || pjt;
    }
  } else {
    base = extractSerialBase(rawStr);
  }

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
 * - getIndividualSerialNo('123-123-131-001~003', 2) -> '123-123-131-002'
 */
export function getIndividualSerialNo(raw: string, pieceNumber: number = 1, _totalQty?: number, explicitProjectNo?: string): string {
  const safePiece = Math.max(1, pieceNumber || 1);
  const pad = String(safePiece).padStart(3, '0');
  const pjt = explicitProjectNo?.trim();
  const rawStr = raw?.trim() || '';

  if (!rawStr) {
    if (pjt) {
      return `${pjt}-${pad}`;
    }
    return `SN-${pad}`;
  }

  let base: string;
  if (pjt) {
    if (rawStr === pjt || rawStr.startsWith(`${pjt}-`)) {
      base = pjt;
    } else {
      base = extractSerialBase(rawStr, pjt) || pjt;
    }
  } else {
    base = extractSerialBase(rawStr);
  }

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

