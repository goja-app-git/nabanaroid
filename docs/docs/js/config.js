export const CFG = {
  // ===== 固定文言 =====
  SAY_IDLE: "ケツダンニコマリマシタラドウゾ",
  SAY_ANGRY: "比較できねぇわ！",
  SAY_SUFFIX: "ニダね～",
  sayWin: (winText) => `${winText}がいいと思う${CFG.SAY_SUFFIX}`,

  // ===== Splash =====
  SPLASH_MS: 5000,

  // ===== 画像 =====
  IMAGE_MANIFEST_URL: "./img/manifest.json",

  // ===== 暗号（モデル）自動取得 =====
  REMOTE_CIPHER_URL: "./model/cipher.txt",   // ★ここに心理テストの出力を貼る
  CIPHER_CACHE_KEY: "nabanaroid_cipher_digits_v1",

  // ===== 復号設定（心理テスト側と一致必須）=====
  PASSPHRASE: "nabana",
  PBKDF2_ITER: 120000,

  // ===== タグ推定/比較判定 =====
  TAGS_PER_ITEM: 5,
  MIN_ITEM_CONF: 0.35,
  DOMAIN_STRICT: true,

  // ===== タグ→ドメイン（例）=====
  DOMAIN_OF_TAG: {
    "food_ramen": "food",
    "food_spicy": "food",
    "food_light": "food",
    "food_heavy": "food",

    "move_fast": "move",
    "move_cheap": "move",

    "stay_luxury": "stay",
    "stay_budget": "stay",

    "act_indoor": "activity",
    "act_outdoor": "activity",

    "money_save": "money",
    "money_spend": "money",

    "other": "other"
  },

  // ===== タグ例文（増やすほど推定がマシになる）=====
  TAG_EXAMPLES: {
    "food_ramen": ["ラーメン","二郎","家系","味噌ラーメン","醤油ラーメン","坦々麺","油そば"],
    "food_spicy": ["辛い","激辛","麻辣","スパイス","唐辛子","カレー"],
    "food_light": ["あっさり","軽め","ヘルシー","うどん","そば"],
    "food_heavy": ["こってり","ガッツリ","背脂","大盛り","肉","にんにく"],

    "move_fast": ["新幹線","飛行機","特急","早い","最速","時間優先"],
    "move_cheap": ["夜行バス","下道","節約","安い移動","鈍行"],

    "stay_luxury": ["温泉旅館","高級ホテル","露天風呂","ご褒美","設備良い"],
    "stay_budget": ["ビジホ","ゲストハウス","安宿","コスパ","素泊まり"],

    "act_indoor": ["インドア","室内","映画","カラオケ","ゲーム","温泉"],
    "act_outdoor": ["アウトドア","登山","釣り","キャンプ","ドライブ","散歩"],

    "money_save": ["節約","安い","コスパ","お金かけない","無料"],
    "money_spend": ["課金","高い","贅沢","お金かける","投資"],

    "other": []
  }
};