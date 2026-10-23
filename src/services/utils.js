/**
 * Safely parse any date value (ISO string, timestamp object, unix epoch)
 * Returns a valid Date object or null if invalid.
 */
export const safeParseDate = (value) => {
  if (!value) return null;
  try {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }
    // Handle Firestore Timestamp { seconds, nanoseconds }
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      const d = new Date(value.seconds * 1000);
      return !isNaN(d.getTime()) ? d : null;
    }
    const d = new Date(value);
    return !isNaN(d.getTime()) ? d : null;
  } catch {
    return null;
  }
};

/**
 * Sanitize cell values for CSV export to prevent Formula / CSV Injection (CWE-1236)
 */
export const sanitizeCsvCell = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // If the value begins with =, +, -, @, tab, or carriage return, prefix with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
};
