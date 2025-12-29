import { CFG } from "./config.js";

const KEY_MODEL = "nabanaroid_model_payload_v1";

export function getCipherDigits(){
  return localStorage.getItem(CFG.CIPHER_CACHE_KEY) || "";
}

export function setCipherDigits(s){
  localStorage.setItem(CFG.CIPHER_CACHE_KEY, String(s).trim());
}

export function saveModelPayload(payload){
  localStorage.setItem(KEY_MODEL, JSON.stringify(payload));
}

export function loadModelPayload(){
  const s = localStorage.getItem(KEY_MODEL);
  if (!s) return null;
  try{
    return JSON.parse(s);
  }catch{
    return null;
  }
}