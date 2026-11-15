// Leaked-password protection via HaveIBeenPwned k-anonymity model.
// Only the first 5 chars of the SHA-1 hash are sent to the API; the
// suffix is matched locally, so the plaintext password never leaves the device.
// Fails open (returns false) if the API is unreachable so users aren't locked out.

export async function isPasswordLeaked(password: string): Promise<boolean> {
  try {
    const data = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return false;
    const text = await res.text();
    return text
      .split('\n')
      .some((line) => line.trim().split(':')[0] === suffix);
  } catch {
    return false;
  }
}
