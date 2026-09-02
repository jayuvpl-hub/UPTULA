/**
 * Same digit-stripping used on login, plus 10-digit Indian mobile shape
 * (strip leading 91 / leading 0). Used by OTP SMS so we don't duplicate
 * parsing in the DropHello sender.
 */
function normalizeIndianPhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

module.exports = { normalizeIndianPhone };
