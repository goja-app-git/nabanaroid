async function deriveKey(passphrase, saltBytes, iter){
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name:"PBKDF2", hash:"SHA-256", salt:saltBytes, iterations:iter },
    baseKey,
    { name:"AES-GCM", length:256 },
    false,
    ["decrypt"]
  );
}

export async function decryptFromBytes({ salt, iv, cipher }, passphrase, iter){
  const key = await deriveKey(passphrase, salt, iter);

  const ptBuf = await crypto.subtle.decrypt(
    { name:"AES-GCM", iv },
    key,
    cipher
  );

  const txt = new TextDecoder().decode(new Uint8Array(ptBuf));
  return JSON.parse(txt);
}