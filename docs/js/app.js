import { CFG } from "./config.js";
import { loadImageManifest, shuffled } from "./images.js";
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

function absUrl(pathLike){
  return new URL(pathLike, location.href).toString();
}

function withBuild(urlStr){
  const u = new URL(urlStr);
  u.searchParams.set("v", CFG.BUILD);
  return u.toString();
}

async function hardResetIfRequested(){
  const sp = new URLSearchParams(location.search);
  if (!sp.has("reset")) return;

  // SW解除
  try{
    if ("serviceWorker" in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  }catch{}

  // Cache全消し
  try{
    if ("caches" in window){
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  }catch{}

  // localStorage消し（モデル/暗号も含めて一旦クリア）
  try{
    localStorage.clear();
  }catch{}

  // reset=1 を外して再読み込み
  sp.delete("reset");
  const newUrl = location.pathname + (sp.toString() ? `?${sp.toString()}` : "") + location.hash;
  location.replace(newUrl);
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

function setAvatarFromList(list){
  const tries = shuffled(list);
  if (!tries.length){ setNoImage(); return; }

  let i = 0;
  avatarImg.onerror = () => {
    i += 1;
    if (i < tries.length) {
      avatarImg.src = withBuild(absUrl(tries[i]));
    } else {
      setNoImage();
    }
  };

  avatarImg.src = withBuild(absUrl(tries[i]));
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
  const url = withBuild(absUrl(CFG.REMOTE_CIPHER_URL));
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`cipher_fetch_${res.status}`);
  const text = (await res.text()).trim();
  if (!text) throw new Error("cipher_empty");
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
  if (a.conf < CFG.MIN_ITEM_CONF && b.conf < CFG.MIN_ITEM_CONF) return true;

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
  await hardResetIfRequested();
  startSplash5s();

  // 画像manifest読み込み（絶対URL+v=BUILD）
  try{
    const manifestUrl = withBuild(absUrl(CFG.IMAGE_MANIFEST_URL));
    IMAGES = await loadImageManifest(manifestUrl);

    // 画像が0なら manifestの中身かファイル名が一致してない
    const cIdle = IMAGES.idle.length;
    const cAngry = IMAGES.angry.length;
    const cNabana = IMAGES.nabana.length;
    if (cIdle === 0 && cAngry === 0 && cNabana === 0){
      setStatus(false, "画像0（img/manifest.json と実ファイル名が不一致）");
    }
  }catch(e){
    IMAGES = { idle:[], angry:[], nabana:[] };
    setStatus(false, `画像manifest読込失敗（${String(e?.message || e)}）`);
  }

  showIdle();

  // 暗号→復号
  try{
    await loadModelFromCipherDigits();
    setStatus(true, "モデルあり");
  }catch(e){
    setStatus(false, `モデル未読込（${String(e?.message || e)}）`);
  }
})();