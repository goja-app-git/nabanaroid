function ub64u(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  s += "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function deriveKey(passphrase, salt, iterations) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

export async function decryptFromB64u(encObj, passphrase, pbkdf2Iter) {
  const salt = ub64u(encObj.saltB64u);
  const iv = ub64u(encObj.ivB64u);
  const cipher = ub64u(encObj.cipherB64u);

  const key = await deriveKey(passphrase, salt, pbkdf2Iter);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(new Uint8Array(plainBuf)));
}