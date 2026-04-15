import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function serializeHash(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${serializeHash(password, salt)}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const incoming = Buffer.from(serializeHash(password, salt), "hex");
  const existing = Buffer.from(hash, "hex");

  return incoming.length === existing.length && timingSafeEqual(incoming, existing);
}
