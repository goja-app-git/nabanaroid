const KEY_MODEL = "nabanaroid_model_v1";
const KEY_CIPHER = "nabanaroid_cipher_digits_v1";

export function saveModelPayload(payload) {
  localStorage.setItem(KEY_MODEL, JSON.stringify(payload));
}
export function loadModelPayload() {
  const s = localStorage.getItem(KEY_MODEL);
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
export function clearModelPayload() {
  localStorage.removeItem(KEY_MODEL);
}

export function setCipherDigits(s){
  localStorage.setItem(KEY_CIPHER, s);
}
export function getCipherDigits(){
  return localStorage.getItem(KEY_CIPHER);
}
export function clearCipherDigits(){
  localStorage.removeItem(KEY_CIPHER);
}