const encoder = new TextEncoder();

async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return crypto.subtle.importKey("raw", bits, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

function toHex(buf: ArrayBuffer | ArrayBufferLike): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
  return `${toHex(salt.buffer as ArrayBuffer)}:${toHex(sig)}`;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [saltHex, sigHex] = hash.split(":");
  const salt = fromHex(saltHex);
  const key = await deriveKey(password, salt);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
  return toHex(sig) === sigHex;
}

export async function hashPin(pin: string): Promise<string> {
  return hashPassword(pin);
}

export async function verifyPin(
  pin: string,
  hash: string
): Promise<boolean> {
  return verifyPassword(pin, hash);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `nk_${toHex(bytes.buffer as ArrayBuffer)}`;
}

export async function hashApiKey(key: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(key));
  return toHex(hash);
}
