export const CFG = {
  SPLASH_MS: 5000,

  // 固定セリフ
  SAY_IDLE: "ケツダンニコマリマシタラドウゾ",
  SAY_ANGRY: "比較できねぇわ！",
  sayWin: (winText) => `${winText}がいいと思うニダね～`,

  // 画像マニフェスト
  IMAGE_MANIFEST_URL: "./img/manifest.json",

  // 復号設定（心理テスト側と一致させる）
  PASSPHRASE: "7f9c1b0d3a6e4c2f8a1d9e0b5c7a3f1d2e6b9a0c4d8f1a5e7c0b3d9a2f6c1e",
  PBKDF2_ITER: 210000,

  // タグ推定
  TAGS_PER_ITEM: 5,
  MIN_ITEM_CONF: 0.18,
  DOMAIN_STRICT: true
};