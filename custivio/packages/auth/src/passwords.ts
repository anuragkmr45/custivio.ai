import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

import { AuthError } from "./errors";

import type { ScryptOptions } from "node:crypto";

const algorithm = "scrypt";
const keyLength = 64;
const scryptCost = 16_384;
const scryptBlockSize = 8;
const scryptParallelization = 1;
const maxMemory = 64 * 1024 * 1024;

function deriveKey(password: string, salt: string, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

function assertPasswordPolicy(password: string): void {
  if (password.length < 12) {
    throw new AuthError("invalid_password_policy", "Password must be at least 12 characters.", 400);
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);

  const salt = randomBytes(16).toString("base64url");
  const derived = await deriveKey(password, salt, {
    N: scryptCost,
    r: scryptBlockSize,
    p: scryptParallelization,
    maxmem: maxMemory,
  });

  return [
    algorithm,
    String(scryptCost),
    String(scryptBlockSize),
    String(scryptParallelization),
    salt,
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [storedAlgorithm, cost, blockSize, parallelization, salt, hash] = storedHash.split("$");

  if (storedAlgorithm !== algorithm || !cost || !blockSize || !parallelization || !salt || !hash) {
    return false;
  }

  const derived = await deriveKey(password, salt, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
    maxmem: maxMemory,
  });
  const expected = Buffer.from(hash, "base64url");

  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
