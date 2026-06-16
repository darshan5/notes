const encoder = new TextEncoder();

interface JwtPayload {
  sub: string;
  sid: string;
  exp: number;
  iat: number;
}

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createJwt(
  payload: Omit<JwtPayload, "iat">,
  secret: string
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload: JwtPayload = { ...payload, iat: Math.floor(Date.now() / 1000) };
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(fullPayload)));
  const data = `${headerB64}.${payloadB64}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return `${data}.${base64url(sig)}`;
}

export async function verifyJwt(
  token: string,
  secret: string
): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const key = await getKey(secret);
  const data = `${headerB64}.${payloadB64}`;
  const sig = base64urlDecode(sigB64);
  const valid = await crypto.subtle.verify("HMAC", key, sig.buffer as ArrayBuffer, encoder.encode(data));
  if (!valid) return null;
  const payload: JwtPayload = JSON.parse(
    new TextDecoder().decode(base64urlDecode(payloadB64))
  );
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
