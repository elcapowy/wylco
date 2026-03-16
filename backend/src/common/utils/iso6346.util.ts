/**
 * Validates a container number according to ISO 6346.
 * Standard format: 4 letters (Owner Code + Category Identifier) + 6 digits (Serial Number) + 1 digit (Check Digit)
 */
export function validateISO6346(containerNumber: string): boolean {
  if (!containerNumber || containerNumber.length !== 11) return false;

  const normalized = containerNumber.toUpperCase();
  const ownerCode = normalized.substring(0, 4);
  const serialNumber = normalized.substring(4, 10);
  const checkDigit = parseInt(normalized.charAt(10), 10);

  if (!/^[A-Z]{4}$/.test(ownerCode) || !/^\d{6}$/.test(serialNumber)) return false;

  const charValue = (char: string): number => {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) return code - 48; // 0-9
    // A=10, B=12, ..., Z=38 (skipping multiples of 11)
    let val = code - 55; // A=10
    if (val >= 11) val++; // Skipping 11
    if (val >= 22) val++; // Skipping 22
    if (val >= 33) val++; // Skipping 33
    return val;
  };

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const val = charValue(normalized.charAt(i));
    sum += val * Math.pow(2, i);
  }

  const calculatedCheckDigit = sum % 11 % 10;
  return calculatedCheckDigit === checkDigit;
}
