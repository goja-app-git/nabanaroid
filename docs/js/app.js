import { CFG } from "./config.js";
import { loadImageManifest, shuffled, safeUrl } from "./images.js";
import { inferTags } from "./tagger.js";
import { decideWithModel } from "./model.js";
import { getCipherDigits, setCipherDigits, loadModelPayload, saveModelPayload } from "./storage.js";
import { digits3ToBytes } from "./digits_codec.js";
import { decryptFromBytes } from "./crypto.js";

const splash = document.getElementById("splash");
const avatarImg = document.getElementById("avatarImg");
const bubble = document.getElementById("bubble");
const modelStatus = document.getElementById("modelStatus");

const inputA = document.getElementById("inputA");
const inputB = document.getElementById("inputB");
const decideBtn = document.getElementById("decideBtn");

let IMAGES = { idle:[], angry:[], nabana:[] };

function say(text){ bubble.textContent = text; }

function setStatus(ok, msg){
  modelStatus.textContent = msg;
  modelStatus.classList.remove("ok","ng");
  modelStatus.classList.add(ok ? "ok" : "ng");
}

function setNoImage(){
  avatarImg.onerror = null;
  avatarImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
      <rect width="100%" height="100%" fill="#000"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            fill="#fff" font-size="26" font-family="sans-serif">NO IMAGE</text>
    </svg>`
  );
}

/** listからランダム順に画像を試し、読めたやつを表示。全滅ならNO IMAGE */
function setAvatarFromList(list){
  const tries = shuffled(list);
  if (!tries.length){ setNoImage(); return; }

  let i = 0;
  avatarImg.onerror = () => {
    i += 1;
    if (i < tries.length) {
      avatarImg.src = safeUrl(tries[i]);
    } else {
      setNoImage();
    }
  };
  avatarImg.src = safeUrl(tries[i]);
}

function showIdle(){
  setAvatarFromList(IMAGES.idle);
  say(CFG.SAY_IDLE);
}
function showAngry(){
  setAvatarFromList(IMAGES.angry);
  say(CFG.SAY_ANGRY);
}
function showWin(winText){
  setAvatarFromList(IMAGES.nabana);
  say(CFG.sayWin(winText));
}

function parseCipherDigits(s){
  const parts = (s || "").trim().split(".");
  if (parts.length !== 4) throw new Error("cipher_format");
  if (parts[0] !== "1") throw new Error("cipher_version");
  return { saltDigits: parts[1], ivDigits: parts[2], cipherDigits: parts[3] };
}

async function fetchRemoteCipher(){
  const res = await fetch(CFG.REMOTE_CIPHER_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("remote_cipher_fetch_failed");
  const text = (await res.text()).trim();
  if (!text) throw new Error("remote_cipher_empty");
  return text;
}

async function ensureCipherInLocal(){
  let digitsStr = getCipherDigits();
  if (digitsStr) return digitsStr;

  digitsStr = await fetchRemoteCipher();
  setCipherDigits(digitsStr);
  return digitsStr;
}

async function loadModelFromCipherDigits(){
  const digitsStr = await ensureCipherInLocal();
  const { saltDigits, ivDigits, cipherDigits } = parseCipherDigits(digitsStr);

  const salt = digits3ToBytes(saltDigits);
  const iv = digits3ToBytes(ivDigits);
  const cipher = digits3ToBytes(cipherDigits);

  const payload = await decryptFromBytes({ salt, iv, cipher }, CFG.PASSPHRASE, CFG.PBKDF2_ITER);
  saveModelPayload(payload);
  return payload;
}

function incomparable(a, b){
  // 両方自信なし
  if (a.conf < CFG.MIN_ITEM_CONF && b.conf < CFG.MIN_ITEM_CONF) return true;

  // ドメインが違いすぎる
  if (CFG.DOMAIN_STRICT){
    if (a.domain !== "other" && b.domain !== "other" && a.domain !== b.domain){
      if (a.conf >= CFG.MIN_ITEM_CONF && b.conf >= CFG.MIN_ITEM_CONF) return true;
    }
  }
  return false;
}

function startSplash5s(){
  setTimeout(() => splash.classList.add("hidden"), CFG.SPLASH_MS);
}

decideBtn.addEventListener("click", () => {
  const aText = inputA.value.trim();
  const bText = inputB.value.trim();
  if (!aText || !bText){ showAngry(); return; }

  const payload = loadModelPayload();
  if (!payload){ showAngry(); return; }

  const a = inferTags(aText, CFG);
  const b = inferTags(bText, CFG);

  if (incomparable(a, b)){ showAngry(); return; }

  const res = decideWithModel(payload, a.tags, b.tags);
  const win = res.pickA ? aText : bText;
  showWin(win);
});

(async function boot(){
  startSplash5s();

  // 画像manifest
  try{
    IMAGES = await loadImageManifest(CFG.IMAGE_MANIFEST_URL);
  }catch{
    IMAGES = { idle:[], angry:[], nabana:[] };
  }

  // まず待機
  showIdle();

  // 暗号自動取得→復号→モデル保存
  try{
    await loadModelFromCipherDigits();
    setStatus(true, "モデルあり");
  }catch{
    setStatus(false, "モデル未読込（cipher.txt/設定確認）");
  }
})();