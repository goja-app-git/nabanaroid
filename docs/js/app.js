import { CFG } from "./config.js";
import { digitsToB64u } from "./digits_codec.js";
import { decryptFromB64u } from "./crypto.js";
import { saveModelPayload, loadModelPayload } from "./storage.js";
import { inferTags } from "./tagger.js";
import { decideWithModel } from "./model.js";
import { loadImageManifest, shuffled } from "./images.js";

const splash = document.getElementById("splash");
const avatarImg = document.getElementById("avatarImg");
const bubble = document.getElementById("bubble");
const modelStatus = document.getElementById("modelStatus");

const inputA = document.getElementById("inputA");
const inputB = document.getElementById("inputB");
const decideBtn = document.getElementById("decideBtn");

let IMAGES = { idle: [], angry: [], nabana: [] };

function say(t){ bubble.textContent = t; }

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

function setAvatarFromList(list){
  const tries = shuffled(list);
  if (!tries.length){ setNoImage(); return; }
  let i = 0;
  avatarImg.onerror = () => {
    i += 1;
    if (i < tries.length) avatarImg.src = tries[i];
    else setNoImage();
  };
  avatarImg.src = tries[i];
}

function showIdle(){
  setAvatarFromList(IMAGES.idle);
  say(CFG.SAY_IDLE);
}
function showAngry(){
  setAvatarFromList(IMAGES.angry);
  say(CFG.SAY_ANGRY);
}
function showWin(winner){
  setAvatarFromList(IMAGES.nabana);
  say(CFG.sayWin(winner));
}

function parseCipherDigits(s){
  const parts = (s || "").trim().split(".");
  if (parts.length !== 4) throw new Error("format");
  if (parts[0] !== "1") throw new Error("ver");
  return { sd: parts[1], id: parts[2], cd: parts[3] };
}

/** ★GitHubに置いた暗号ファイルを読み込んで復号 */
async function loadModelFromRepo(){
  const url = CFG.MODEL_FETCH_NOCACHE
    ? `${CFG.MODEL_DIGITS_URL}?v=${Date.now()}`
    : CFG.MODEL_DIGITS_URL;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("digits_fetch_failed");

  const digitsStr = (await res.text()).trim();
  const { sd, id, cd } = parseCipherDigits(digitsStr);

  const encObj = {
    saltB64u: digitsToB64u(sd),
    ivB64u: digitsToB64u(id),
    cipherB64u: digitsToB64u(cd)
  };

  const payload = await decryptFromB64u(encObj, CFG.PASSPHRASE, CFG.PBKDF2_ITER);
  saveModelPayload(payload); // 端末内にモデル（復号後）を保存して推論に使う
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

decideBtn.addEventListener("click", () => {
  const aText = inputA.value.trim();
  const bText = inputB.value.trim();
  if (!aText || !bText){ showAngry(); return; }

  const payload = loadModelPayload();
  if (!payload){ showAngry(); return; }

  const a = inferTags(aText, CFG.TAGS_PER_ITEM);
  const b = inferTags(bText, CFG.TAGS_PER_ITEM);

  if (incomparable(a, b)){ showAngry(); return; }

  const res = decideWithModel(payload, a.tags, b.tags);
  const winner = res.pickA ? aText : bText;
  showWin(winner);
});

(function bootSplash(){
  setTimeout(() => splash.classList.add("hidden"), CFG.SPLASH_MS);
})();

(async function boot(){
  // 画像manifest
  try{
    IMAGES = await loadImageManifest(CFG.IMAGE_MANIFEST_URL);
  }catch{
    IMAGES = { idle:[], angry:[], nabana:[] };
  }

  // 待機表示
  showIdle();

  // ★モデルをGitHubから読む
  try{
    await loadModelFromRepo();
    setStatus(true, "モデル: GitHub");
  }catch{
    setStatus(false, "モデルなし（docs/model/nabana.digits を確認）");
  }
})();