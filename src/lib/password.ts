import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";

/**
 * The legacy PHP app hashed passwords client-side with SHA-512 and then stored
 * a bcrypt hash of that digest server-side. To stay compatible with any
 * existing `members` rows we keep the same two-step scheme:
 *
 *   stored = bcrypt( sha512_hex(plaintext) )
 *
 * This is transparent to users and lets old and new accounts share one
 * verification path.
 */
function sha512Hex(plaintext: string): string {
  return createHash("sha512").update(plaintext, "utf8").digest("hex");
}

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(sha512Hex(plaintext), 10);
}

export async function verifyPassword(
  plaintext: string,
  storedHash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(sha512Hex(plaintext), storedHash);
  } catch {
    return false;
  }
}
