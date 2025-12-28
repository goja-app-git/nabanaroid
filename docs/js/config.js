 export const CFG = {
  // ===== 既存の設定（そのまま） =====
  APP_NAME: "菜花ロイド",
  SPLASH_MS: 5000,

  SAY_IDLE: "ケツダンニコマリマシタラドウゾ",
  SAY_ANGRY: "比較できねぇわ！",
  sayWin: (winner) => `${winner}がいいと思うニダね～`,

  // 暗号復号に使う（既存のまま）
  PASSPHRASE: "your-passphrase-here",
  PBKDF2_ITER: 120000,

  // 画像マニフェスト（既存のまま）
  IMAGE_MANIFEST_URL: "./img/manifest.json",

  // タグ推定・比較可否（既存のまま）
  TAGS_PER_ITEM: 5,
  MIN_ITEM_CONF: 0.18,
  DOMAIN_STRICT: true,

  // ===== ★追加：GitHubに置いた暗号を読む =====
  MODEL_DIGITS_URL: "./model/nabana.digits",
  MODEL_FETCH_NOCACHE: true
};