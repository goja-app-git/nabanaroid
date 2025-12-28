import { CFG } from "./config.js";
import { digitsToB64u } from "./digits_codec.js";
import { decryptFromB64u } from "./crypto.js";
import { saveModelPayload, loadModelPayload, getCipherDigits } from "./storage.js";
import { inferTags } from "./tagger.js";
import { decideWithModel } from "./model.js";
import { loadImageManifest, pickRandom } from "./images.js";

const splash = document.getElementById("splash");
const avatarImg = document.getElementById("avatarImg");
const bubble = document.getElementById("bubble");
const modelStatus = document.getElementById("modelStatus");

const inputA = document.getElementById("inputA");
const inputB = document.getElementById("inputB");
const decideBtn = document.getElementById("decideBtn");

let IMAGES = { idle:[], angry:[], nabana:[] };

function setAvatar(src){
  if (!src) { avatarImg.src = ""; return; }
  avatarImg.src = src;
}
function say(text){ bubble.textContent = text; }

function setStatus(ok, msg){
  modelStatus.textContent = msg;
  modelStatus.classList.remove("ok","ng");
  modelStatus.classList.add(ok ? "ok" : "ng");
}

function ensureImageFallback(){
  avatarImg.onerror = () => {
    avatarImg.onerror = null;
    avatarImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <rect width="100%" height="100%" fill="#000"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              fill="#fff" font-size="26" font-family="sans-serif">NO IMAGE</text>
      </svg>`
    );
  };
}

function showIdle(){
  setAvatar(pickRandom(IMAGES.idle));
  say(CFG.SAY_IDLE);
}
function showAngry(){
  setAvatar(pickRandom(IMAGES.angry));
  say(CFG.SAY_ANGRY);
}
function showWin(winText){
  setAvatar(pickRandom(IMAGES.nabana));
  say(CFG.sayWin(winText));
}

function parseCipherDigits(s){
  const parts = (s || "").trim().split(".");
  if (parts.length !== 4) throw new Error("format");
  if (parts[0] !== "1") throw new Error("ver");
  return { sd: parts[1], id: parts[2], cd: parts[3] };
}

async function loadModelFromStoredCipher(){
  const digitsStr = getCipherDigits();
  if (!digitsStr) throw new Error("no_cipher");

  const { sd, id, cd } = parseCipherDigits(digitsStr);
  const encObj = {
    saltB64u: digitsToB64u(sd),
    ivB64u: digitsToB64u(id),
    cipherB64u: digitsToB64u(cd)
  };
  const payload = await decryptFromB64u(encObj, CFG.PASSPHRASE, CFG.PBKDF2_ITER);
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

// splash 5秒固定
function startSplash5s(){
  setTimeout(() => splash.classList.add("hidden"), CFG.SPLASH_MS);
}

decideBtn.addEventListener("click", () => {
  const aText = inputA.value.trim();
  const bText = inputB.value.trim();
  if (!aText || !bText){
    showAngry();
    return;
  }

  const payload = loadModelPayload();
  if (!payload){
    // 暗号が未設定 or 未復号
    showAngry();
    return;
  }

  const a = inferTags(aText, CFG.TAGS_PER_ITEM);
  const b = inferTags(bText, CFG.TAGS_PER_ITEM);

  if (incomparable(a, b)){
    showAngry();
    return;
  }

  const res = decideWithModel(payload, a.tags, b.tags);
  const win = res.pickA ? aText : bText;
  showWin(win);
});

// boot
(async function boot(){
  ensureImageFallback();
  startSplash5s();

  // 画像マニフェスト読み込み（名前/拡張子自由運用）
  try{
    IMAGES = await loadImageManifest(CFG.IMAGE_MANIFEST_URL);
  }catch{
    IMAGES = { idle:[], angry:[], nabana:[] };
  }

  // 初期表示
  showIdle();

  // 暗号が保存されていれば自動復号してモデルをローカルに保存
  try{
    await loadModelFromStoredCipher();
    setStatus(true, "モデルあり");
  }catch{
    setStatus(false, "未読込（modelページで暗号保存）");
  }
})();