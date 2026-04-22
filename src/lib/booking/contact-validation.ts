/** Indian mobile: exactly 10 digits, no letters or symbols. */
export function phoneBookingError(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return "Phone number is required.";
  }
  if (!/^\d{10}$/.test(trimmed)) {
    if (/\D/.test(trimmed)) {
      return "Phone must contain only numbers (no letters or symbols).";
    }
    return "Phone must be exactly 10 digits.";
  }
  return null;
}

/** Full name: required, no digits, at least one letter (any script). */
export function customerNameBookingError(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Name is required.";
  }
  if (/\d/.test(trimmed)) {
    return "Name must not contain numbers.";
  }
  if (!/\p{L}/u.test(trimmed)) {
    return "Name must include at least one letter.";
  }
  return null;
}
